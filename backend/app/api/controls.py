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
    """List controls with optional filters and pagination.
    ---
    tags:
      - Controls
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: family_id
        in: query
        type: string
        required: false
        description: Filter by control family UUID
      - name: implementation_status
        in: query
        type: string
        required: false
        enum: [implemented, partially_implemented, planned, not_implemented, not_applicable, not_assessed]
        description: Filter by implementation status
      - name: control_type
        in: query
        type: string
        required: false
        description: Filter by control type
      - name: search
        in: query
        type: string
        required: false
        description: Search across control_number, title, requirement_text
      - name: page
        in: query
        type: integer
        required: false
        default: 1
      - name: per_page
        in: query
        type: integer
        required: false
        default: 50
    responses:
      200:
        description: Paginated list of controls
        schema:
          type: object
          properties:
            controls:
              type: array
              items:
                allOf:
                  - $ref: '#/definitions/Control'
                  - type: object
                    properties:
                      family_code:
                        type: string
                      family_name:
                        type: string
            total:
              type: integer
            page:
              type: integer
            per_page:
              type: integer
    """
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
    """Get a single control with objectives, evidence, and POA&M items.
    ---
    tags:
      - Controls
    parameters:
      - name: control_id
        in: path
        type: string
        required: true
        description: Control UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Control details with related data
        schema:
          allOf:
            - $ref: '#/definitions/Control'
            - type: object
              properties:
                family_code:
                  type: string
                family_name:
                  type: string
                objectives:
                  type: array
                  items:
                    $ref: '#/definitions/AssessmentObjective'
                evidence:
                  type: array
                  items:
                    $ref: '#/definitions/Evidence'
                poam_items:
                  type: array
                  items:
                    $ref: '#/definitions/POAMItem'
      404:
        description: Control not found
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Update a control's assessment fields.
    ---
    tags:
      - Controls
    parameters:
      - name: control_id
        in: path
        type: string
        required: true
        description: Control UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            implementation_status:
              type: string
              enum: [implemented, partially_implemented, planned, not_implemented, not_applicable, not_assessed]
            implementation_notes:
              type: string
            assessor_notes:
              type: string
            last_assessed_date:
              type: string
            assessed_by:
              type: string
            plain_english:
              type: string
            guidance_text:
              type: string
    responses:
      200:
        description: Updated control
        schema:
          $ref: '#/definitions/Control'
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Control not found
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Quick-update a control's implementation status.
    ---
    tags:
      - Controls
    parameters:
      - name: control_id
        in: path
        type: string
        required: true
        description: Control UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - implementation_status
          properties:
            implementation_status:
              type: string
              enum: [implemented, partially_implemented, planned, not_implemented, not_applicable, not_assessed]
            assessed_by:
              type: string
    responses:
      200:
        description: Updated control
        schema:
          $ref: '#/definitions/Control'
      400:
        description: Missing or invalid implementation_status
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Control not found
        schema:
          $ref: '#/definitions/Error'
    """
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
    """List all control families with status breakdown.
    ---
    tags:
      - Controls
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: List of control families with status counts
        schema:
          type: array
          items:
            allOf:
              - $ref: '#/definitions/ControlFamily'
              - type: object
                properties:
                  actual_control_count:
                    type: integer
                  status_breakdown:
                    type: object
                    description: Map of implementation_status to count
    """
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
    """Export all controls with objectives for reporting.
    ---
    tags:
      - Controls
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Full control export with objectives
        schema:
          type: object
          properties:
            controls:
              type: array
              items:
                allOf:
                  - $ref: '#/definitions/Control'
                  - type: object
                    properties:
                      family_code:
                        type: string
                      family_name:
                        type: string
                      objectives:
                        type: array
                        items:
                          $ref: '#/definitions/AssessmentObjective'
            total:
              type: integer
            exported_at:
              type: string
              description: ISO timestamp of export
    """
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
