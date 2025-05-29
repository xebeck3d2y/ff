from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        logger.debug("Received registration request")
        logger.debug(f"Request data: {request.json}")
        
        data = request.json
        if not data:
            logger.error("No data provided")
            return jsonify({"message": "Aucune donnée fournie"}), 400
            
        email = data.get('email')
        password = data.get('password')
        display_name = data.get('displayName')
        
        logger.debug(f"Processing registration for email: {email}")
        
        if not all([email, password, display_name]):
            missing = []
            if not email: missing.append("email")
            if not password: missing.append("mot de passe")
            if not display_name: missing.append("nom d'affichage")
            return jsonify({"message": f"Champs manquants: {', '.join(missing)}"}), 400
        
        user, error = AuthService.register_user(email, password, display_name)
        
        if error:
            logger.error(f"Registration error: {error}")
            return jsonify({"message": error}), 400
            
        logger.debug("Registration successful")
        return jsonify({
            "message": "Inscription réussie",
            "user": user.to_dict()
        }), 201
        
    except Exception as e:
        logger.exception("Unexpected error during registration")
        return jsonify({"message": f"Erreur inattendue: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        if not data:
            return jsonify({"message": "Aucune donnée fournie"}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"message": "Email et mot de passe requis"}), 400
            
        user, token, error = AuthService.login_user(email, password)
        
        if error:
            return jsonify({"message": error}), 401
            
        return jsonify({
            "token": token,
            "user": user.to_dict()
        }), 200
        
    except Exception as e:
        logger.exception("Unexpected error during login")
        return jsonify({"message": f"Erreur inattendue: {str(e)}"}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    from models import User
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({
        "user": user.to_dict()
    }), 200

@auth_bp.route('/users', methods=['DELETE'])
@jwt_required()
def delete_users():
    try:
        # Get the current user to check if they're an admin
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or current_user.role != 'admin':
            return jsonify({"message": "Accès non autorisé"}), 403
            
        # Get the email to delete (if provided)
        data = request.json
        email_to_delete = data.get('email') if data else None
        
        if email_to_delete:
            # Delete specific user
            user = User.query.filter_by(email=email_to_delete).first()
            if not user:
                return jsonify({"message": "Utilisateur non trouvé"}), 404
            db.session.delete(user)
        else:
            # Delete all users except admin
            User.query.filter(User.role != 'admin').delete()
            
        db.session.commit()
        return jsonify({"message": "Utilisateurs supprimés avec succès"}), 200
        
    except Exception as e:
        logger.exception("Error deleting users")
        db.session.rollback()
        return jsonify({"message": f"Erreur lors de la suppression: {str(e)}"}), 500

