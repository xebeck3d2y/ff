from models import db, User
from flask_jwt_extended import create_access_token
import logging
import re

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    def register_user(email, password, display_name=None):
        """Register a new user"""
        try:
            # Validate email format
            email_pattern = r'^[a-zA-Z0-9._%+-]+@inpt\.ma$'
            if not re.match(email_pattern, email):
                return None, "L'adresse email doit être au format @inpt.ma"

            # Check if email already exists
            logger.debug(f"Checking if user exists: {email}")
            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                logger.warning(f"User already exists: {email}")
                return None, "Cette adresse email est déjà utilisée"

            # Check if display name already exists
            if display_name:
                existing_username = User.query.filter_by(display_name=display_name).first()
                if existing_username:
                    return None, "Ce nom d'utilisateur est déjà pris"

            logger.debug(f"Creating new user: {email}")
            user = User(email=email, display_name=display_name)
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            logger.info(f"User created successfully: {email}")
            
            return user, None
            
        except Exception as e:
            logger.exception("Error in register_user")
            db.session.rollback()
            return None, f"Erreur lors de la création du compte: {str(e)}"

    @staticmethod
    def login_user(email, password):
        """Login a user and return an access token"""
        try:
            logger.debug(f"Attempting login for user: {email}")
            user = User.query.filter_by(email=email).first()
            
            if not user:
                logger.warning(f"User not found: {email}")
                return None, None, "Email ou mot de passe incorrect"
            
            if not user.check_password(password):
                logger.warning(f"Invalid password for user: {email}")
                return None, None, "Email ou mot de passe incorrect"
            
            logger.debug(f"Creating access token for user: {email}")
            user_id_str = str(user.id)
            access_token = create_access_token(identity=user_id_str)
            logger.info(f"Login successful for user: {email}")
            
            return user, access_token, None
            
        except Exception as e:
            logger.exception("Error in login_user")
            return None, None, f"Erreur lors de la connexion: {str(e)}"