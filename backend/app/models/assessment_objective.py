from app.extensions import db


class AssessmentObjective(db.Model):
    __tablename__ = 'assessment_objectives'

    id = db.Column(db.String(36), primary_key=True)
    control_id = db.Column(db.String(36), db.ForeignKey('controls.id'), nullable=False)
    objective_number = db.Column(db.String(30), nullable=False)
    objective_text = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='not_assessed')
    notes = db.Column(db.Text)
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'control_id': self.control_id,
            'objective_number': self.objective_number,
            'objective_text': self.objective_text,
            'status': self.status,
            'notes': self.notes,
            'session_id': self.session_id,
        }
