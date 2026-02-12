from app.extensions import db


class Control(db.Model):
    __tablename__ = 'controls'

    id = db.Column(db.String(36), primary_key=True)
    family_id = db.Column(db.String(36), db.ForeignKey('control_families.id'), nullable=False)
    control_number = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    requirement_text = db.Column(db.Text)
    plain_english = db.Column(db.Text)
    guidance_text = db.Column(db.Text)
    control_type = db.Column(db.String(20))
    implementation_status = db.Column(db.String(30), default='not_assessed')
    weight = db.Column(db.Integer, default=1)
    sprs_points_if_not_met = db.Column(db.Integer)
    implementation_notes = db.Column(db.Text)
    assessor_notes = db.Column(db.Text)
    last_assessed_date = db.Column(db.String(30))
    assessed_by = db.Column(db.String(100))
    sort_order = db.Column(db.Integer)
    session_id = db.Column(db.String(100), default='__default__')

    objectives = db.relationship('AssessmentObjective', backref='control', lazy='dynamic')
    evidence_items = db.relationship('Evidence', backref='control', lazy='dynamic')
    poam_items = db.relationship('POAMItem', backref='control', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'family_id': self.family_id,
            'control_number': self.control_number,
            'title': self.title,
            'requirement_text': self.requirement_text,
            'plain_english': self.plain_english,
            'guidance_text': self.guidance_text,
            'control_type': self.control_type,
            'implementation_status': self.implementation_status,
            'weight': self.weight,
            'sprs_points_if_not_met': self.sprs_points_if_not_met,
            'implementation_notes': self.implementation_notes,
            'assessor_notes': self.assessor_notes,
            'last_assessed_date': self.last_assessed_date,
            'assessed_by': self.assessed_by,
            'sort_order': self.sort_order,
            'session_id': self.session_id,
        }
