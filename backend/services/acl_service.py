from models import db, FileShare, User, File

class ACLService:
    @staticmethod
    def share_file(file_id, owner_id, recipient_email, can_view=True, can_edit=False, can_delete=False):
        """Share a file with another user"""
        # Check file exists and belongs to owner
        file = File.query.filter_by(id=file_id, owner_id=owner_id).first()
        if not file:
            return False, "File not found or you don't have permission"
            
        # Find recipient user
        recipient = User.query.filter_by(email=recipient_email).first()
        if not recipient:
            return False, "Recipient user not found"
            
        # Don't share with self
        if recipient.id == owner_id:
            return False, "Cannot share file with yourself"
            
        # Check if already shared
        existing_share = FileShare.query.filter_by(file_id=file_id, user_id=recipient.id).first()
        
        if existing_share:
            # Update existing share
            existing_share.can_view = can_view
            existing_share.can_edit = can_edit
            existing_share.can_delete = can_delete
        else:
            # Create new share
            share = FileShare(
                file_id=file_id,
                user_id=recipient.id,
                can_view=can_view,
                can_edit=can_edit,
                can_delete=can_delete
            )
            db.session.add(share)
            
        # Update file shared status
        file.is_shared = True
        db.session.commit()
        
        # Get updated file with shared users
        file = File.query.get(file_id)
        shared_users = [{
            "id": share.user.id,
            "email": share.user.email,
            "canView": share.can_view,
            "canEdit": share.can_edit,
            "canDelete": share.can_delete,
        } for share in file.shared_users]
        
        return True, {"message": f"File shared with {recipient_email}", "sharedUsers": shared_users}
    
    @staticmethod
    def revoke_share(file_id, owner_id, user_id):
        """Revoke file sharing with a user"""
        try:
            # Check file exists and belongs to owner
            file = File.query.filter_by(id=file_id).first()
            if not file:
                return False, "File not found"
            
            # Allow both file owner and users with shares to revoke access
            if file.owner_id != owner_id:
                requester_share = FileShare.query.filter_by(
                    file_id=file_id, 
                    user_id=owner_id
                ).first()
                if not requester_share:
                    return False, "You don't have permission to revoke access"

            # Find and delete the share
            share = FileShare.query.filter_by(file_id=file_id, user_id=user_id).first()
            if not share:
                return False, "Share not found"
                
            db.session.delete(share)
            
            # Update file shared status if this was the last share
            remaining_shares = FileShare.query.filter_by(file_id=file_id).count()
            if remaining_shares <= 1:  # 1 because we haven't committed the delete yet
                file.is_shared = False
                
            db.session.commit()
            
            # Get updated shared users list
            updated_shares = FileShare.query.filter_by(file_id=file_id).all()
            shared_users = [{
                "id": share.user.id,
                "email": share.user.email,
                "canView": share.can_view,
                "canEdit": share.can_edit,
                "canDelete": share.can_delete,
            } for share in updated_shares]
            
            return True, {"message": "Share revoked successfully", "sharedUsers": shared_users}
            
        except Exception as e:
            db.session.rollback()
            return False, str(e)

    @staticmethod
    def get_shared_users(file_id, owner_id):
        """Get users with whom a file is shared"""
        # Check if the file exists and belongs to the owner
        file = File.query.filter_by(id=file_id, owner_id=owner_id).first()
        if not file:
            return False, "File not found or you don't have permission"

        # Retrieve shared users
        shares = FileShare.query.filter_by(file_id=file_id).all()
        if not shares:
            return True, []  # No users shared with this file

        shared_users = [
            {
                "id": share.user.id,
                "email": share.user.email,
                "canView": share.can_view,
                "canEdit": share.can_edit,
                "canDelete": share.can_delete,
            }
            for share in shares
        ]

        return True, shared_users
