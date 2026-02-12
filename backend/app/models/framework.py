from app.extensions import db


class Framework(db.Model):
    __tablename__ = 'frameworks'

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    version = db.Column(db.String(50))
    description = db.Column(db.Text)
    total_controls = db.Column(db.Integer)
    total_objectives = db.Column(db.Integer)
    session_id = db.Column(db.String(100), default='__default__')

    families = db.relationship('ControlFamily', backref='framework', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'version': self.version,
            'description': self.description,
            'total_controls': self.total_controls,
            'total_objectives': self.total_objectives,
            'session_id': self.session_id,
        }
