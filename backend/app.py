import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from models import db, bcrypt, User
from config import Config

from controllers.auth_controller import auth_bp
from controllers.file_controller import file_bp
from controllers.user_controller import user_bp

def create_app(config_class=Config):
    app = Flask(__name__, static_folder='static')
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt = JWTManager(app)
    migrate = Migrate(app, db)
    
    # Configure CORS to accept requests from frontend with credentials
    CORS(app, 
         resources={r"/*": {"origins": "*"}},
         allow_credentials=True,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"])
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(file_bp, url_prefix='/api/files')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy'}, 200

    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    return app

if __name__ == "__main__":
    app = create_app()
    
    # Create all tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Create a test admin user if none exists
        if not User.query.filter_by(email='admin@inpt.ma').first():
            admin = User(
                email='admin@inpt.ma',
                display_name='Admin User',
                role='admin',
                status='active'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            # Create a test regular user
            user = User(
                email='user@example.com',
                display_name='Test User',
                role='user',
                status='active'
            )
            user.set_password('user123')
            db.session.add(user)
            
            db.session.commit()
    
    app.run(debug=True, host="localhost", port=5000, threaded=True)

