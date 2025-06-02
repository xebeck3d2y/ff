from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from models import User, db
import logging
from datetime import datetime, timedelta
import pyotp
import base64

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

@auth_bp.route('/login', methods=['POST'])
def login():
    print("LOGIN ROUTE CALLED")  # Add this line
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401

    # Check lockout
    if hasattr(user, "lockout_until") and user.lockout_until and user.lockout_until > datetime.utcnow():
        seconds_left = int((user.lockout_until - datetime.utcnow()).total_seconds())
        return jsonify({'message': 'locked', 'seconds_left': seconds_left}), 403

    if not user.check_password(password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 3:
            user.lockout_until = datetime.utcnow() + timedelta(seconds=30)
            user.failed_login_attempts = 0
            db.session.commit()
            return jsonify({'message': 'locked', 'seconds_left': 30}), 403
        db.session.commit()
        return jsonify({'message': 'Invalid credentials'}), 401

    # Success: reset attempts
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.session.commit()

    # Check if 2FA is enabled
    if user.is_2fa_enabled:
        # If 2FA is enabled, return a status indicating 2FA is required
        # We won't issue the full token yet
        return jsonify({"message": "2FA required", "user_id": user.id}), 202 # Use 202 Accepted

    # If 2FA is NOT enabled, issue the full token
    access_token = create_access_token(identity=user.id)
    return jsonify({'token': access_token, 'user': user.to_dict()}), 200

@auth_bp.route('/2fa/setup/init', methods=['POST'])
@jwt_required()
def init_2fa_setup():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.is_2fa_enabled:
        return jsonify({"message": "2FA is already enabled for this user"}), 400

    # Generate a secret key for the user
    secret = pyotp.random_base32()
    user.two_factor_secret = secret
    db.session.commit()

    # Generate the provisioning URI (for QR code)
    app_name = "SecureApp"
    uri = pyotp.totp.TOTP(secret).provisioning_uri(user.email, issuer_name=app_name)

    return jsonify({"secret": secret, "qr_uri": uri}), 200

@auth_bp.route('/2fa/setup/confirm', methods=['POST'])
@jwt_required()
def confirm_2fa_setup():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    code = data.get('code')

    if not user.two_factor_secret:
        return jsonify({"message": "2FA setup not initiated"}), 400

    if user.is_2fa_enabled:
         return jsonify({"message": "2FA is already enabled"}), 400

    if not code:
        return jsonify({"message": "2FA code is required"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(code):
        user.is_2fa_enabled = True
        db.session.commit()
        return jsonify({"message": "2FA enabled successfully"}), 200
    else:
        return jsonify({"message": "Invalid 2FA code"}), 400

@auth_bp.route('/2fa/verify', methods=['POST'])
def verify_2fa():
    data = request.get_json()
    user_id = data.get('user_id') # Get user_id from the initial login step
    code = data.get('code')

    if not user_id or not code:
        return jsonify({"message": "User ID and 2FA code are required"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if not user.is_2fa_enabled or not user.two_factor_secret:
        return jsonify({"message": "2FA not enabled for this user"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(code):
        # If 2FA code is valid, issue the full access token
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token, 'user': user.to_dict()}), 200
    else:
        return jsonify({"message": "Invalid 2FA code"}), 400

@auth_bp.route('/2fa/disable', methods=['POST'])
@jwt_required()
def disable_2fa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()
    code = data.get('code')

    if not user.is_2fa_enabled or not user.two_factor_secret:
        return jsonify({"message": "2FA is not enabled for this user"}), 400

    if not code:
        return jsonify({"message": "2FA code is required"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(code):
        user.is_2fa_enabled = False
        user.two_factor_secret = None # Remove secret after disabling
        db.session.commit()
        return jsonify({"message": "2FA disabled successfully"}), 200
    else:
        return jsonify({"message": "Invalid 2FA code"}), 400

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

