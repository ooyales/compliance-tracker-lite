def register_blueprints(app):
    from app.api.auth import auth_bp
    from app.api.dashboard import dashboard_bp
    from app.api.frameworks import frameworks_bp
    from app.api.controls import controls_bp
    from app.api.evidence import evidence_bp
    from app.api.poam import poam_bp
    from app.api.boundary import boundary_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(frameworks_bp, url_prefix='/api/frameworks')
    app.register_blueprint(controls_bp, url_prefix='/api/controls')
    app.register_blueprint(evidence_bp, url_prefix='/api/evidence')
    app.register_blueprint(poam_bp, url_prefix='/api/poam')
    app.register_blueprint(boundary_bp, url_prefix='/api/boundary')
