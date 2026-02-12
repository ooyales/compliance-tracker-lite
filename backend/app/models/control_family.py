from app.extensions import db


class ControlFamily(db.Model):
    __tablename__ = 'control_families'

    id = db.Column(db.String(36), primary_key=True)
    framework_id = db.Column(db.String(36), db.ForeignKey('frameworks.id'), nullable=False)
    family_code = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    control_count = db.Column(db.Integer)
    sort_order = db.Column(db.Integer)
    session_id = db.Column(db.String(100), default='__default__')

    controls = db.relationship('Control', backref='family', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'framework_id': self.framework_id,
            'family_code': self.family_code,
            'name': self.name,
            'description': self.description,
            'control_count': self.control_count,
            'sort_order': self.sort_order,
            'session_id': self.session_id,
        }
