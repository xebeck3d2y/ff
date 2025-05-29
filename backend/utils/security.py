import os
import secrets
import hashlib
from werkzeug.utils import secure_filename
from flask import current_app

def generate_secure_token(length=32):
    return secrets.token_hex(length)

def get_file_hash(file_path):
    """Generate SHA-256 hash of file contents"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_unique_filename(filename):
    """Create a unique filename by adding a random token"""
    name, ext = os.path.splitext(secure_filename(filename))
    return f"{name}_{generate_secure_token(8)}{ext}"
