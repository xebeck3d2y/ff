import os
import shutil
from werkzeug.utils import secure_filename
from flask import current_app
from .security import get_unique_filename

def ensure_upload_folder():
    """Ensure the upload folder exists"""
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)

def save_uploaded_file(file, filename=None):
    """
    Save an uploaded file to the configured upload folder
    Returns: (saved_path, file_size)
    """
    ensure_upload_folder()
    
    if filename is None:
        filename = get_unique_filename(file.filename)
    else:
        filename = secure_filename(filename)
        
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    return file_path, file_size

def delete_file(file_path):
    """Delete a file from the filesystem"""
    if os.path.exists(file_path) and os.path.isfile(file_path):
        os.remove(file_path)
        return True
    return False