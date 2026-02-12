from datetime import datetime
from app.extensions import db


class Evidence(db.Model):
    __tablename__ = 'evidence'

    id = db.Column(db.String(36), primary_key=True)
    control_id = db.Column(db.String(36), db.ForeignKey('controls.id'), nullable=False)
    evidence_type = db.Column(db.String(30))
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    file_path = db.Column(db.String(500))
    external_url = db.Column(db.String(500))
    uploaded_at = db.Column(db.String(30), default=lambda: datetime.now().isoformat())
    uploaded_by = db.Column(db.String(100))
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'control_id': self.control_id,
            'evidence_type': self.evidence_type,
            'title': self.title,
            'description': self.description,
            'file_path': self.file_path,
            'external_url': self.external_url,
            'uploaded_at': self.uploaded_at,
            'uploaded_by': self.uploaded_by,
            'session_id': self.session_id,
        }
