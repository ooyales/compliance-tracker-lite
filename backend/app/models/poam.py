from datetime import datetime
from app.extensions import db


class POAMItem(db.Model):
    __tablename__ = 'poam_items'

    id = db.Column(db.String(36), primary_key=True)
    control_id = db.Column(db.String(36), db.ForeignKey('controls.id'), nullable=False)
    weakness_description = db.Column(db.Text)
    remediation_plan = db.Column(db.Text)
    risk_level = db.Column(db.String(20), default='moderate')
    responsible_person = db.Column(db.String(200))
    responsible_team = db.Column(db.String(200))
    planned_start_date = db.Column(db.String(30))
    planned_completion_date = db.Column(db.String(30))
    actual_completion_date = db.Column(db.String(30))
    estimated_cost = db.Column(db.Float)
    cost_notes = db.Column(db.Text)
    status = db.Column(db.String(30), default='open')
    milestones = db.Column(db.Text, default='[]')
    created_at = db.Column(db.String(30), default=lambda: datetime.now().isoformat())
    updated_at = db.Column(db.String(30), default=lambda: datetime.now().isoformat())
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'control_id': self.control_id,
            'weakness_description': self.weakness_description,
            'remediation_plan': self.remediation_plan,
            'risk_level': self.risk_level,
            'responsible_person': self.responsible_person,
            'responsible_team': self.responsible_team,
            'planned_start_date': self.planned_start_date,
            'planned_completion_date': self.planned_completion_date,
            'actual_completion_date': self.actual_completion_date,
            'estimated_cost': self.estimated_cost,
            'cost_notes': self.cost_notes,
            'status': self.status,
            'milestones': self.milestones,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'session_id': self.session_id,
        }
