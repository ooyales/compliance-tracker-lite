import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.poam import POAMItem
from app.models.control import Control

poam_bp = Blueprint('poam', __name__)


@poam_bp.route('', methods=['GET'])
def list_poam():
    """List all POA&M items with optional filters.
    ---
    tags:
      - POA&M
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: status
        in: query
        type: string
        required: false
        enum: [open, in_progress, completed, cancelled]
        description: Filter by POA&M status
      - name: risk_level
        in: query
        type: string
        required: false
        enum: [critical, high, moderate, low]
        description: Filter by risk level
    responses:
      200:
        description: List of POA&M items enriched with control info
        schema:
          type: array
          items:
            allOf:
              - $ref: '#/definitions/POAMItem'
              - type: object
                properties:
                  control_number:
                    type: string
                  control_title:
                    type: string
    """
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
    """Create a new POA&M item linked to a control.
    ---
    tags:
      - POA&M
    parameters:
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
            - control_id
          properties:
            control_id:
              type: string
              description: UUID of the linked control
            weakness_description:
              type: string
            remediation_plan:
              type: string
            risk_level:
              type: string
              enum: [critical, high, moderate, low]
              default: moderate
            responsible_person:
              type: string
            responsible_team:
              type: string
            planned_start_date:
              type: string
              description: ISO date string
            planned_completion_date:
              type: string
              description: ISO date string
            actual_completion_date:
              type: string
              description: ISO date string
            estimated_cost:
              type: number
            cost_notes:
              type: string
            status:
              type: string
              enum: [open, in_progress, completed, cancelled]
              default: open
            milestones:
              type: string
              description: JSON string of milestones array
              default: "[]"
    responses:
      201:
        description: POA&M item created
        schema:
          $ref: '#/definitions/POAMItem'
      400:
        description: Missing request body or control_id
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Linked control not found
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Update an existing POA&M item.
    ---
    tags:
      - POA&M
    parameters:
      - name: poam_id
        in: path
        type: string
        required: true
        description: POA&M item UUID
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
            weakness_description:
              type: string
            remediation_plan:
              type: string
            risk_level:
              type: string
              enum: [critical, high, moderate, low]
            responsible_person:
              type: string
            responsible_team:
              type: string
            planned_start_date:
              type: string
            planned_completion_date:
              type: string
            actual_completion_date:
              type: string
            estimated_cost:
              type: number
            cost_notes:
              type: string
            status:
              type: string
              enum: [open, in_progress, completed, cancelled]
            milestones:
              type: string
    responses:
      200:
        description: Updated POA&M item
        schema:
          $ref: '#/definitions/POAMItem'
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
      404:
        description: POA&M item not found
        schema:
          $ref: '#/definitions/Error'
    """
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
    """Delete a POA&M item.
    ---
    tags:
      - POA&M
    parameters:
      - name: poam_id
        in: path
        type: string
        required: true
        description: POA&M item UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: POA&M item deleted
        schema:
          type: object
          properties:
            message:
              type: string
              example: POA&M item deleted
      404:
        description: POA&M item not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    item = POAMItem.query.filter_by(
        id=poam_id, session_id=session_id
    ).first()

    if not item:
        return jsonify({'message': 'POA&M item not found'}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({'message': 'POA&M item deleted'}), 200
