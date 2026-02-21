import uuid
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.boundary_asset import BoundaryAsset

boundary_bp = Blueprint('boundary', __name__)


@boundary_bp.route('', methods=['GET'])
def list_boundary_assets():
    """List all system boundary assets.
    ---
    tags:
      - Boundary
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: List of boundary assets
        schema:
          type: array
          items:
            $ref: '#/definitions/BoundaryAsset'
    """
    session_id = request.args.get('session_id', '__default__')
    assets = BoundaryAsset.query.filter_by(session_id=session_id).all()
    return jsonify([a.to_dict() for a in assets])


@boundary_bp.route('', methods=['POST'])
def create_boundary_asset():
    """Create a new system boundary asset.
    ---
    tags:
      - Boundary
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
          properties:
            boundary_name:
              type: string
              description: Name of the authorization boundary
            asset_tracker_id:
              type: string
              description: External asset tracking ID
            asset_name:
              type: string
              description: Name of the asset
            asset_type:
              type: string
              description: Type of asset (e.g. Server, Workstation, Network Device)
            data_classification:
              type: string
              description: Data classification level (e.g. CUI, Public)
            in_scope:
              type: integer
              description: 1 if in scope, 0 if out of scope
              default: 1
            notes:
              type: string
    responses:
      201:
        description: Boundary asset created
        schema:
          $ref: '#/definitions/BoundaryAsset'
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    data = request.get_json()

    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    asset = BoundaryAsset(
        id=str(uuid.uuid4()),
        boundary_name=data.get('boundary_name'),
        asset_tracker_id=data.get('asset_tracker_id'),
        asset_name=data.get('asset_name'),
        asset_type=data.get('asset_type'),
        data_classification=data.get('data_classification'),
        in_scope=data.get('in_scope', 1),
        notes=data.get('notes'),
        session_id=session_id,
    )

    db.session.add(asset)
    db.session.commit()

    return jsonify(asset.to_dict()), 201


@boundary_bp.route('/<asset_id>', methods=['PUT'])
def update_boundary_asset(asset_id):
    """Update an existing boundary asset.
    ---
    tags:
      - Boundary
    parameters:
      - name: asset_id
        in: path
        type: string
        required: true
        description: Boundary asset UUID
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
            boundary_name:
              type: string
            asset_tracker_id:
              type: string
            asset_name:
              type: string
            asset_type:
              type: string
            data_classification:
              type: string
            in_scope:
              type: integer
            notes:
              type: string
    responses:
      200:
        description: Updated boundary asset
        schema:
          $ref: '#/definitions/BoundaryAsset'
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Boundary asset not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    asset = BoundaryAsset.query.filter_by(
        id=asset_id, session_id=session_id
    ).first()

    if not asset:
        return jsonify({'message': 'Boundary asset not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    updatable_fields = [
        'boundary_name', 'asset_tracker_id', 'asset_name',
        'asset_type', 'data_classification', 'in_scope', 'notes',
    ]

    for field in updatable_fields:
        if field in data:
            setattr(asset, field, data[field])

    db.session.commit()
    return jsonify(asset.to_dict())


@boundary_bp.route('/<asset_id>', methods=['DELETE'])
def delete_boundary_asset(asset_id):
    """Delete a boundary asset.
    ---
    tags:
      - Boundary
    parameters:
      - name: asset_id
        in: path
        type: string
        required: true
        description: Boundary asset UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Boundary asset deleted
        schema:
          type: object
          properties:
            message:
              type: string
              example: Boundary asset deleted
      404:
        description: Boundary asset not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    asset = BoundaryAsset.query.filter_by(
        id=asset_id, session_id=session_id
    ).first()

    if not asset:
        return jsonify({'message': 'Boundary asset not found'}), 404

    db.session.delete(asset)
    db.session.commit()

    return jsonify({'message': 'Boundary asset deleted'}), 200
