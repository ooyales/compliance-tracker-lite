import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.poam import POAMItem
from app.models.control import Control

poam_bp = Blueprint('poam', __name__)


@poam_bp.route('', methods=['GET'])
def list_poam():
    session_id = request.args.get('session_id', '__default__')
    status = request.args.get('status')
    risk_level = request.args.get('risk_level')

    query = POAMItem.query.filter_by(session_id=session_id)

    if status:
        query = query.filter_by(status=status)
    if risk_level:
        query = query.filter_by(risk_level=risk_level)

    items = query.order_by(POAMItem.created_at.desc()).all()

    results = []
    for p in items:
        d = p.to_dict()
        control = Control.query.get(p.control_id)
        if control:
            d['control_number'] = control.control_number
            d['control_title'] = control.title
        results.append(d)

    return jsonify(results)


@poam_bp.route('', methods=['POST'])
def create_poam():
    session_id = request.args.get('session_id', '__default__')
    data = request.get_json()

    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    if 'control_id' not in data or not data['control_id']:
        return jsonify({'message': 'control_id is required'}), 400

    # Verify control exists
    control = Control.query.filter_by(
        id=data['control_id'], session_id=session_id
    ).first()
    if not control:
        return jsonify({'message': 'Control not found'}), 404

    now = datetime.now().isoformat()

    item = POAMItem(
        id=str(uuid.uuid4()),
        control_id=data['control_id'],
        weakness_description=data.get('weakness_description'),
        remediation_plan=data.get('remediation_plan'),
        risk_level=data.get('risk_level', 'moderate'),
        responsible_person=data.get('responsible_person'),
        responsible_team=data.get('responsible_team'),
        planned_start_date=data.get('planned_start_date'),
        planned_completion_date=data.get('planned_completion_date'),
        actual_completion_date=data.get('actual_completion_date'),
        estimated_cost=data.get('estimated_cost'),
        cost_notes=data.get('cost_notes'),
        status=data.get('status', 'open'),
        milestones=data.get('milestones', '[]'),
        created_at=now,
        updated_at=now,
        session_id=session_id,
    )

    db.session.add(item)
    db.session.commit()

    return jsonify(item.to_dict()), 201


@poam_bp.route('/<poam_id>', methods=['PUT'])
def update_poam(poam_id):
    session_id = request.args.get('session_id', '__default__')
    item = POAMItem.query.filter_by(
        id=poam_id, session_id=session_id
    ).first()

    if not item:
        return jsonify({'message': 'POA&M item not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    updatable_fields = [
        'weakness_description', 'remediation_plan', 'risk_level',
        'responsible_person', 'responsible_team', 'planned_start_date',
        'planned_completion_date', 'actual_completion_date', 'estimated_cost',
        'cost_notes', 'status', 'milestones',
    ]

    for field in updatable_fields:
        if field in data:
            setattr(item, field, data[field])

    item.updated_at = datetime.now().isoformat()

    db.session.commit()
    return jsonify(item.to_dict())


@poam_bp.route('/<poam_id>', methods=['DELETE'])
def delete_poam(poam_id):
    session_id = request.args.get('session_id', '__default__')
    item = POAMItem.query.filter_by(
        id=poam_id, session_id=session_id
    ).first()

    if not item:
        return jsonify({'message': 'POA&M item not found'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'POA&M item deleted'}), 200
