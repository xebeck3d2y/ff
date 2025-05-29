import os
from models import db, File, FileShare, User
from utils.file_handling import save_uploaded_file, delete_file

class FileService:
    @staticmethod
    def get_user_files(user_id):
        """Get all files owned by a user"""
        return File.query.filter_by(owner_id=user_id).all()
    
    @staticmethod
    def get_shared_files(user_id):
        """Get all files shared with a user"""
        shares = FileShare.query.filter_by(user_id=user_id, can_view=True).all()
        file_ids = [share.file_id for share in shares]
        return File.query.filter(File.id.in_(file_ids)).all() if file_ids else []
    
    @staticmethod
    def upload_file(user_id, file_obj):
        """Upload a new file"""
        file_path, file_size = save_uploaded_file(file_obj)
        
        # Create file record
        file = File(
            name=file_obj.filename,
            path=file_path,
            type=file_obj.content_type,
            size=file_size,
            owner_id=user_id,
            is_shared=False
        )
        
        db.session.add(file)
        db.session.commit()
        
        return file
    
    @staticmethod
    def delete_file(file_id):
        """Delete a file"""
        file = File.query.get(file_id)
        if not file:
            return False, "File not found"
        
        # Delete physical file
        if file.path and os.path.exists(file.path):
            delete_file(file.path)
            
        # Delete from database
        db.session.delete(file)
        db.session.commit()
        
        return True, "File deleted"
    
    @staticmethod
    def get_file_by_id(file_id):
        """Get a file by ID"""
        return File.query.get(file_id)

