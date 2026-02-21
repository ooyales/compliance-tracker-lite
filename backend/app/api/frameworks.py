from flask import Blueprint, jsonify, request
from app.models.framework import Framework
from app.models.control_family import ControlFamily

frameworks_bp = Blueprint('frameworks', __name__)


@frameworks_bp.route('', methods=['GET'])
def list_frameworks():
    """List all compliance frameworks.
    ---
    tags:
      - Frameworks
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: List of frameworks
        schema:
          type: array
          items:
            $ref: '#/definitions/Framework'
    """
    session_id = request.args.get('session_id', '__default__')
    frameworks = Framework.query.filter_by(session_id=session_id).all()
    return jsonify([f.to_dict() for f in frameworks])


@frameworks_bp.route('/<framework_id>', methods=['GET'])
def get_framework(framework_id):
    """Get a single framework with its control families.
    ---
    tags:
      - Frameworks
    parameters:
      - name: framework_id
        in: path
        type: string
        required: true
        description: Framework UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Framework details with families
        schema:
          allOf:
            - $ref: '#/definitions/Framework'
            - type: object
              properties:
                families:
                  type: array
                  items:
                    $ref: '#/definitions/ControlFamily'
      404:
        description: Framework not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    framework = Framework.query.filter_by(
        id=framework_id, session_id=session_id
    ).first()

    if not framework:
        return jsonify({'message': 'Framework not found'}), 404

    families = ControlFamily.query.filter_by(
        framework_id=framework_id, session_id=session_id
    ).order_by(ControlFamily.sort_order).all()

    result = framework.to_dict()
    result['families'] = [f.to_dict() for f in families]

    return jsonify(result)
