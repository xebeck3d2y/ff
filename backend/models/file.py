from datetime import datetime
from . import db

class File(db.Model):
    __tablename__ = 'files'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    path = db.Column(db.String(512), nullable=False)
    type = db.Column(db.String(100))
    size = db.Column(db.Integer)
    is_shared = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    shares = db.relationship('FileShare', backref='shared_file', lazy='joined', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'size': self.size,
            'isShared': self.is_shared,
            'createdAt': self.created_at.isoformat(),
            'owner': self.owner.to_dict() if self.owner else None,
            'sharedUsers': [{
                'id': share.user.id,
                'email': share.user.email,
                'canView': share.can_view,
                'canEdit': share.can_edit,
                'canDelete': share.can_delete
            } for share in self.shares] if self.is_shared else []
        }
