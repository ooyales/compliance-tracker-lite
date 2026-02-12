from app.extensions import db


class BoundaryAsset(db.Model):
    __tablename__ = 'boundary_assets'

    id = db.Column(db.String(36), primary_key=True)
    boundary_name = db.Column(db.String(200))
    asset_tracker_id = db.Column(db.String(100))
    asset_name = db.Column(db.String(200))
    asset_type = db.Column(db.String(50))
    data_classification = db.Column(db.String(20))
    in_scope = db.Column(db.Integer, default=1)
    notes = db.Column(db.Text)
    session_id = db.Column(db.String(100), default='__default__')

    def to_dict(self):
        return {
            'id': self.id,
            'boundary_name': self.boundary_name,
            'asset_tracker_id': self.asset_tracker_id,
            'asset_name': self.asset_name,
            'asset_type': self.asset_type,
            'data_classification': self.data_classification,
            'in_scope': self.in_scope,
            'notes': self.notes,
            'session_id': self.session_id,
        }
