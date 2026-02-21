from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash

auth_bp = Blueprint('auth', __name__)

# Hardcoded demo users
DEMO_USERS = {
    'admin': {
        'id': 'user-admin-001',
        'username': 'admin',
        'password': generate_password_hash('admin123'),
        'role': 'Admin',
        'name': 'Admin User',
        'email': 'admin@compliance.local',
    },
    'analyst': {
        'id': 'user-analyst-001',
        'username': 'analyst',
        'password': generate_password_hash('analyst123'),
        'role': 'Analyst',
        'name': 'Security Analyst',
        'email': 'analyst@compliance.local',
    },
}


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate and get a JWT token.
    ---
    tags:
      - Auth
    security: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - username
            - password
          properties:
            username:
              type: string
              example: admin
            password:
              type: string
              example: admin123
    responses:
      200:
        description: Login successful
        schema:
          type: object
          properties:
            token:
              type: string
              description: JWT access token
            access_token:
              type: string
              description: JWT access token (alias)
            user:
              type: object
              properties:
                id:
                  type: string
                username:
                  type: string
                role:
                  type: string
                name:
                  type: string
                email:
                  type: string
      400:
        description: Missing request body
        schema:
          $ref: '#/definitions/Error'
      401:
        description: Invalid credentials
        schema:
          $ref: '#/definitions/Error'
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = DEMO_USERS.get(username)
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'message': 'Invalid username or password'}), 401

    access_token = create_access_token(
        identity=user['id'],
        additional_claims={
            'username': user['username'],
            'role': user['role'],
        }
    )

    return jsonify({
        'token': access_token,
        'access_token': access_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'role': user['role'],
            'name': user['name'],
            'email': user['email'],
        }
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    """Get current authenticated user profile.
    ---
    tags:
      - Auth
    responses:
      200:
        description: Current user profile
        schema:
          type: object
          properties:
            id:
              type: string
            username:
              type: string
            role:
              type: string
            name:
              type: string
            email:
              type: string
      404:
        description: User not found
        schema:
          $ref: '#/definitions/Error'
    """
    current_user_id = get_jwt_identity()

    for user in DEMO_USERS.values():
        if user['id'] == current_user_id:
            return jsonify({
                'id': user['id'],
                'username': user['username'],
                'role': user['role'],
                'name': user['name'],
                'email': user['email'],
            })

    return jsonify({'message': 'User not found'}), 404
