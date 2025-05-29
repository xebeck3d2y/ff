from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import db, User, File, FileShare
import logging

logger = logging.getLogger(__name__)

def jwt_required_with_user(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            # Convertir l'ID en entier pour la recherche dans la base de données
            try:
                user_id_int = int(user_id)
                user = User.query.get(user_id_int)
            except (ValueError, TypeError):
                logger.error(f"Invalid user ID format: {user_id}")
                return jsonify({"message": "Invalid user ID"}), 401
            
            if not user:
                logger.warning(f"User not found for ID: {user_id}")
                # Retourner une réponse vide au lieu d'une erreur
                if request.method == 'GET':
                    return jsonify({"files": [], "sharedFiles": []}), 200
                return jsonify({"message": "User not found"}), 404
                
            return fn(user, *args, **kwargs)
            
        except Exception as e:
            logger.error(f"Auth error: {str(e)}")
            # Retourner une réponse vide au lieu d'une erreur pour les requêtes GET
            if request.method == 'GET':
                return jsonify({"files": [], "sharedFiles": []}), 200
            return jsonify({"message": "Authentication required"}), 401
            
    return wrapper

def file_access_required(permission='view'):
    def decorator(fn):
        @wraps(fn)
        def wrapper(user, file_id, *args, **kwargs):
            try:
                file = File.query.get(file_id)
                if not file:
                    return jsonify({"message": "File not found"}), 404
                    
                # Owner has all permissions
                if file.owner_id == user.id:
                    return fn(user, file, *args, **kwargs)
                    
                # Check shared permissions
                share = FileShare.query.filter_by(
                    file_id=file_id, 
                    user_id=user.id
                ).first()
                
                if not share:
                    return jsonify({"message": "Access denied"}), 403
                    
                if permission == 'view' and not share.can_view:
                    return jsonify({"message": "No view permission"}), 403
                elif permission == 'edit' and not share.can_edit:
                    return jsonify({"message": "No edit permission"}), 403
                elif permission == 'delete' and not share.can_delete:
                    return jsonify({"message": "No delete permission"}), 403
                    
                return fn(user, file, *args, **kwargs)
                
            except Exception as e:
                logger.error(f"File access error: {str(e)}")
                return jsonify({"message": "Error checking file access"}), 500
                
        return wrapper
    return decorator
