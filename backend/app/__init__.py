import os
from flask import Flask
from flasgger import Swagger
from sqlalchemy import BigInteger
from sqlalchemy.ext.compiler import compiles
from app.config import config
from app.extensions import db, jwt, cors
from app.errors import register_error_handlers


SWAGGER_TEMPLATE = {
    "info": {
        "title": "Compliance Tracker Lite API",
        "description": "API for the Compliance Tracker — NIST SP 800-171 control assessment, "
                       "POA&M management, evidence tracking, system boundary mapping, and SPRS scoring.",
        "version": "1.0.0",
    },
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT token. Enter: **Bearer {your-jwt-token}**"
        }
    },
    "security": [{"Bearer": []}],
    "basePath": "/",
    "schemes": ["http", "https"],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {
                "message": {"type": "string"}
            }
        },
        "Framework": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "version": {"type": "string"},
                "description": {"type": "string"},
                "total_controls": {"type": "integer"},
                "total_objectives": {"type": "integer"},
                "session_id": {"type": "string"}
            }
        },
        "ControlFamily": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "framework_id": {"type": "string"},
                "family_code": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "control_count": {"type": "integer"},
                "sort_order": {"type": "integer"},
                "session_id": {"type": "string"}
            }
        },
        "Control": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "family_id": {"type": "string"},
                "control_number": {"type": "string"},
                "title": {"type": "string"},
                "requirement_text": {"type": "string"},
                "plain_english": {"type": "string"},
                "guidance_text": {"type": "string"},
                "control_type": {"type": "string"},
                "implementation_status": {"type": "string", "enum": [
                    "implemented", "partially_implemented", "planned",
                    "not_implemented", "not_applicable", "not_assessed"
                ]},
                "weight": {"type": "integer"},
                "sprs_points_if_not_met": {"type": "integer"},
                "implementation_notes": {"type": "string"},
                "assessor_notes": {"type": "string"},
                "last_assessed_date": {"type": "string"},
                "assessed_by": {"type": "string"},
                "sort_order": {"type": "integer"},
                "session_id": {"type": "string"}
            }
        },
        "AssessmentObjective": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "control_id": {"type": "string"},
                "objective_number": {"type": "string"},
                "objective_text": {"type": "string"},
                "status": {"type": "string", "enum": [
                    "implemented", "partially_implemented", "planned",
                    "not_implemented", "not_applicable", "not_assessed"
                ]},
                "notes": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "Evidence": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "control_id": {"type": "string"},
                "evidence_type": {"type": "string"},
                "title": {"type": "string"},
                "description": {"type": "string"},
                "file_path": {"type": "string"},
                "external_url": {"type": "string"},
                "uploaded_at": {"type": "string"},
                "uploaded_by": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "POAMItem": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "control_id": {"type": "string"},
                "weakness_description": {"type": "string"},
                "remediation_plan": {"type": "string"},
                "risk_level": {"type": "string", "enum": ["critical", "high", "moderate", "low"]},
                "responsible_person": {"type": "string"},
                "responsible_team": {"type": "string"},
                "planned_start_date": {"type": "string"},
                "planned_completion_date": {"type": "string"},
                "actual_completion_date": {"type": "string"},
                "estimated_cost": {"type": "number"},
                "cost_notes": {"type": "string"},
                "status": {"type": "string", "enum": ["open", "in_progress", "completed", "cancelled"]},
                "milestones": {"type": "string"},
                "created_at": {"type": "string"},
                "updated_at": {"type": "string"},
                "session_id": {"type": "string"}
            }
        },
        "BoundaryAsset": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "boundary_name": {"type": "string"},
                "asset_tracker_id": {"type": "string"},
                "asset_name": {"type": "string"},
                "asset_type": {"type": "string"},
                "data_classification": {"type": "string"},
                "in_scope": {"type": "integer"},
                "notes": {"type": "string"},
                "session_id": {"type": "string"}
            }
        }
    }
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: rule.rule.startswith('/api/'),
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}


@compiles(BigInteger, 'sqlite')
def _render_bigint_as_int(type_, compiler, **kw):
    return 'INTEGER'


def create_app(config_name=None):
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config[config_name])

    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    jwt.init_app(app)

    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

    from app.api import register_blueprints
    register_blueprints(app)

    register_error_handlers(app)

    @app.route('/api/health')
    def health_check():
        """Health check endpoint.
        ---
        tags:
          - System
        security: []
        responses:
          200:
            description: Service is healthy
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: healthy
                timestamp:
                  type: string
                  example: "2026-02-20T12:00:00"
                app:
                  type: string
                  example: compliance-tracker-lite
        """
        from flask import jsonify
        from datetime import datetime
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'app': 'compliance-tracker-lite'
        })

    # Demo auth (enabled via DEMO_AUTH_ENABLED env var)
    try:
        from demo_auth import init_demo_auth
        from demo_sessions import SessionManager
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if db_uri.startswith('sqlite:///'):
            template_db = os.path.join(app.instance_path, db_uri.replace('sqlite:///', ''))
        else:
            template_db = os.path.join(app.instance_path, 'compliance_tracker.db')
        _session_mgr = SessionManager(
            template_db=template_db,
            sessions_dir=os.path.join(os.path.dirname(app.instance_path), 'data', 'sessions')
        )
        init_demo_auth(app, session_manager=_session_mgr)
    except ImportError:
        pass

    register_cli(app)
    return app


def register_cli(app):
    @app.cli.command('seed')
    def seed_command():
        from app.seed import seed
        seed()
        print('Database seeded.')

    @app.cli.command('init-db')
    def init_db_command():
        db.create_all()
        print('Database initialized.')

    @app.cli.command('reset-db')
    def reset_db_command():
        db.drop_all()
        db.create_all()
        from app.seed import seed
        seed()
        print('Database reset and seeded.')
