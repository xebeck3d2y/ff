import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "your_default_secret_key")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your_default_jwt_secret")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URI", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 24  # 1 day
    UPLOAD_FOLDER = os.path.abspath("backend/static/uploads")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload