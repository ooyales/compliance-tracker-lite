import uuid
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.boundary_asset import BoundaryAsset

boundary_bp = Blueprint('boundary', __name__)


@boundary_bp.route('', methods=['GET'])
def list_boundary_assets():
    session_id = request.args.get('session_id', '__default__')
    assets = BoundaryAsset.query.filter_by(session_id=session_id).all()
    return jsonify([a.to_dict() for a in assets])


@boundary_bp.route('', methods=['POST'])
def create_boundary_asset():
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
    session_id = request.args.get('session_id', '__default__')
    asset = BoundaryAsset.query.filter_by(
        id=asset_id, session_id=session_id
    ).first()

    if not asset:
        return jsonify({'message': 'Boundary asset not found'}), 404

    db.session.delete(asset)
    db.session.commit()

    return jsonify({'message': 'Boundary asset deleted'}), 200
