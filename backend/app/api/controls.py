import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.control import Control
from app.models.control_family import ControlFamily
from app.models.assessment_objective import AssessmentObjective
from app.models.evidence import Evidence
from app.models.poam import POAMItem

controls_bp = Blueprint('controls', __name__)


@controls_bp.route('', methods=['GET'])
def list_controls():
    session_id = request.args.get('session_id', '__default__')
    family_id = request.args.get('family_id')
    implementation_status = request.args.get('implementation_status')
    control_type = request.args.get('control_type')
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = Control.query.filter_by(session_id=session_id)

    if family_id:
        query = query.filter_by(family_id=family_id)
    if implementation_status:
        query = query.filter_by(implementation_status=implementation_status)
    if control_type:
        query = query.filter_by(control_type=control_type)
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Control.control_number.ilike(search_pattern),
                Control.title.ilike(search_pattern),
                Control.requirement_text.ilike(search_pattern),
            )
        )

    query = query.order_by(Control.sort_order)
    total = query.count()
    controls = query.offset((page - 1) * per_page).limit(per_page).all()

    # Enrich with family info
    family_ids = set(c.family_id for c in controls)
    families = {f.id: f for f in ControlFamily.query.filter(
        ControlFamily.id.in_(family_ids)
    ).all()} if family_ids else {}

    results = []
    for c in controls:
        d = c.to_dict()
        fam = families.get(c.family_id)
        if fam:
            d['family_code'] = fam.family_code
            d['family_name'] = fam.name
        results.append(d)

    return jsonify({
        'controls': results,
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@controls_bp.route('/<control_id>', methods=['GET'])
def get_control(control_id):
    session_id = request.args.get('session_id', '__default__')
    control = Control.query.filter_by(
        id=control_id, session_id=session_id
    ).first()

    if not control:
        return jsonify({'message': 'Control not found'}), 404

    result = control.to_dict()

    # Get family info
    family = ControlFamily.query.get(control.family_id)
    if family:
        result['family_code'] = family.family_code
        result['family_name'] = family.name

    # Get objectives
    objectives = AssessmentObjective.query.filter_by(
        control_id=control_id, session_id=session_id
    ).all()
    result['objectives'] = [o.to_dict() for o in objectives]

    # Get evidence
    evidence = Evidence.query.filter_by(
        control_id=control_id, session_id=session_id
    ).all()
    result['evidence'] = [e.to_dict() for e in evidence]

    # Get POA&M items
    poam = POAMItem.query.filter_by(
        control_id=control_id, session_id=session_id
    ).all()
    result['poam_items'] = [p.to_dict() for p in poam]

    return jsonify(result)


@controls_bp.route('/<control_id>', methods=['PUT'])
def update_control(control_id):
    session_id = request.args.get('session_id', '__default__')
    control = Control.query.filter_by(
        id=control_id, session_id=session_id
    ).first()

    if not control:
        return jsonify({'message': 'Control not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    updatable_fields = [
        'implementation_status', 'implementation_notes', 'assessor_notes',
        'last_assessed_date', 'assessed_by', 'plain_english', 'guidance_text',
    ]

    for field in updatable_fields:
        if field in data:
            setattr(control, field, data[field])

    if 'implementation_status' in data and 'last_assessed_date' not in data:
        control.last_assessed_date = datetime.now().isoformat()

    db.session.commit()
    return jsonify(control.to_dict())


@controls_bp.route('/<control_id>/status', methods=['PUT'])
def update_control_status(control_id):
    session_id = request.args.get('session_id', '__default__')
    control = Control.query.filter_by(
        id=control_id, session_id=session_id
    ).first()

    if not control:
        return jsonify({'message': 'Control not found'}), 404

    data = request.get_json()
    if not data or 'implementation_status' not in data:
        return jsonify({'message': 'implementation_status is required'}), 400

    valid_statuses = [
        'implemented', 'partially_implemented', 'planned',
        'not_implemented', 'not_applicable', 'not_assessed',
    ]
    if data['implementation_status'] not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of: {valid_statuses}'}), 400

    control.implementation_status = data['implementation_status']
    control.last_assessed_date = datetime.now().isoformat()

    if 'assessed_by' in data:
        control.assessed_by = data['assessed_by']

    db.session.commit()
    return jsonify(control.to_dict())


@controls_bp.route('/families', methods=['GET'])
def list_families():
    session_id = request.args.get('session_id', '__default__')
    families = ControlFamily.query.filter_by(
        session_id=session_id
    ).order_by(ControlFamily.sort_order).all()

    results = []
    for fam in families:
        d = fam.to_dict()
        # Get actual control count and status breakdown
        controls = Control.query.filter_by(
            family_id=fam.id, session_id=session_id
        ).all()
        d['actual_control_count'] = len(controls)
        d['status_breakdown'] = {}
        for c in controls:
            s = c.implementation_status or 'not_assessed'
            d['status_breakdown'][s] = d['status_breakdown'].get(s, 0) + 1
        results.append(d)

    return jsonify(results)


@controls_bp.route('/export', methods=['GET'])
def export_controls():
    session_id = request.args.get('session_id', '__default__')
    controls = Control.query.filter_by(
        session_id=session_id
    ).order_by(Control.sort_order).all()

    family_ids = set(c.family_id for c in controls)
    families = {f.id: f for f in ControlFamily.query.filter(
        ControlFamily.id.in_(family_ids)
    ).all()} if family_ids else {}

    results = []
    for c in controls:
        d = c.to_dict()
        fam = families.get(c.family_id)
        if fam:
            d['family_code'] = fam.family_code
            d['family_name'] = fam.name

        # Include objectives
        objectives = AssessmentObjective.query.filter_by(
            control_id=c.id, session_id=session_id
        ).all()
        d['objectives'] = [o.to_dict() for o in objectives]

        results.append(d)

    return jsonify({
        'controls': results,
        'total': len(results),
        'exported_at': datetime.now().isoformat(),
    })
