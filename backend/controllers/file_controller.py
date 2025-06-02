import os
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.file_service import FileService
from utils.decorators import jwt_required_with_user, file_access_required
import logging

logger = logging.getLogger(__name__)
file_bp = Blueprint('files', __name__, url_prefix='/api/files')

@file_bp.route('/api/files', methods=['GET', 'POST', 'OPTIONS'])
def handle_files():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        # Vérifier le token manuellement
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.warning("No valid authorization header")
            return jsonify({"message": "Authentication required"}), 401

        # Si c'est une requête GET, retourner une liste vide au lieu d'une erreur
        if request.method == 'GET':
            return jsonify({
                "files": [],
                "sharedFiles": []
            }), 200

        # Pour les requêtes POST, vérifier le contenu
        if request.method == 'POST':
            if 'file' not in request.files:
                return jsonify({"message": "No file provided"}), 400

            file = request.files['file']
            if file.filename == '':
                return jsonify({"message": "No file selected"}), 400

            # Retourner une réponse vide mais valide
            return jsonify({"message": "File upload not available"}), 403

    except Exception as e:
        logger.error(f"Error in file handling: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@file_bp.route('', methods=['GET'])
@jwt_required_with_user
def get_files(user):
    # Get files owned by the user
    own_files = FileService.get_user_files(user.id)
    
    # Get files shared with the user
    shared_files = FileService.get_shared_files(user.id)
    
    return jsonify({
        "files": [file.to_dict() for file in own_files],
        "sharedFiles": [file.to_dict() for file in shared_files]
    }), 200

@file_bp.route('', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = get_jwt_identity()
    print("UPLOAD: user_id", user_id)
    if 'file' not in request.files:
        print("NO FILE PART")
        return jsonify({"message": "No file part"}), 400
    file = request.files['file']
    print("UPLOAD: filename", file.filename)
    if file.filename == '':
        print("NO SELECTED FILE")
        return jsonify({"message": "No selected file"}), 400
    try:
        from flask import current_app
        upload_folder = current_app.config['UPLOAD_FOLDER']
        print("UPLOAD_FOLDER:", upload_folder)
        if not os.path.exists(upload_folder):
            print("UPLOAD: folder does not exist, creating...")
            os.makedirs(upload_folder, exist_ok=True)
        uploaded_file = FileService.upload_file(user_id, file)
        print("UPLOAD OK")
        return jsonify(uploaded_file.to_dict()), 201
    except Exception as e:
        import traceback
        print("UPLOAD ERROR:", e)
        traceback.print_exc()
        return jsonify({"message": f"Upload failed: {str(e)}"}), 500

@file_bp.route('/<int:file_id>', methods=['GET'])
@jwt_required_with_user
@file_access_required('view')
def get_file(user, file):
    return jsonify(file.to_dict()), 200

@file_bp.route('/<int:file_id>/download', methods=['GET'])
@jwt_required_with_user
@file_access_required('view')
def download_file(user, file):
    # Ensure file exists on disk
    if not os.path.exists(file.path):
        return jsonify({"message": "File not found on server"}), 404
        
    return send_file(
        file.path,
        as_attachment=True,
        download_name=file.name
    )

@file_bp.route('/<int:file_id>', methods=['DELETE'])
@jwt_required_with_user
@file_access_required('delete')
def delete_file(user, file):
    success, message = FileService.delete_file(file.id)
    
    if not success:
        return jsonify({"message": message}), 400
        
    return jsonify({"message": message}), 200

@file_bp.route('/<int:file_id>/share', methods=['POST'])
@jwt_required_with_user
def share_file(user, file_id):
    data = request.json
    
    if not data:
        return jsonify({"message": "No input data provided"}), 400
        
    recipient_email = data.get('email')
    can_view = data.get('canView', True)
    can_edit = data.get('canEdit', False)
    can_delete = data.get('canDelete', False)
    
    if not recipient_email:
        return jsonify({"message": "Recipient email is required"}), 400
    
    from services.acl_service import ACLService
    success, result = ACLService.share_file(
        file_id, user.id, recipient_email, can_view, can_edit, can_delete
    )
    
    if not success:
        return jsonify({"message": result}), 400
        
    return jsonify({
        "message": result["message"],
        "sharedUsers": result["sharedUsers"]
    }), 200

@file_bp.route('/<int:file_id>/share/<int:user_id>', methods=['DELETE'])
@jwt_required_with_user
def revoke_share(user, file_id, user_id):
    try:
        from services.acl_service import ACLService
        success, result = ACLService.revoke_share(file_id, user.id, user_id)
        
        if not success:
            logger.error(f"Failed to revoke access: {result}")
            return jsonify({"message": result}), 400
            
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error in revoke_share: {str(e)}")
        return jsonify({"message": "Failed to revoke access. Please try again."}), 500

@file_bp.route('/<int:file_id>/shared-users', methods=['GET'])
@jwt_required_with_user
def get_shared_users(user, file_id):
    from services.acl_service import ACLService
    success, shared_users_or_message = ACLService.get_shared_users(file_id, user.id)

    if not success:
        logger.error(f"Error retrieving shared users for file {file_id}: {shared_users_or_message}")
        return jsonify({"message": shared_users_or_message}), 400

    return jsonify({"sharedUsers": shared_users_or_message}), 200
