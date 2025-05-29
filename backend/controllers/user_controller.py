from flask import Blueprint, request, jsonify
from utils.decorators import jwt_required_with_user
from models import User, db

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('/debug', methods=['GET'])
def debug():
    try:
        # Check database connection
        db.session.execute('SELECT 1')
        
        # Get user count
        user_count = User.query.count()
        
        # Get all users
        users = User.query.all()
        
        return jsonify({
            "status": "ok",
            "user_count": user_count,
            "users": [user.to_dict() for user in users],
            "database_url": str(db.engine.url)
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@user_bp.route('', methods=['GET'])
@jwt_required_with_user
def get_users(user):
    try:
        users = User.query.all()
        return jsonify({
            "users": [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

@user_bp.route('/search', methods=['GET'])
@jwt_required_with_user
def search_users(user):
    try:
        query = request.args.get('query', '')
        
        # If query is empty, return all users
        if not query:
            users = User.query.all()
        else:
            # Search with the query
            users = User.query.filter(
                (User.email.ilike(f'%{query}%')) | 
                (User.display_name.ilike(f'%{query}%'))
            ).all()
        
        # Don't include the current user
        users = [u for u in users if u.id != user.id]
        
        return jsonify({
            "users": [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 500

