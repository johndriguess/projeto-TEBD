import os
from datetime import datetime
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'uploads'

def save_file_with_timestamp(file):
    if not file or file.filename == '':
        return None, "Nome de arquivo vazio"

    filename = secure_filename(file.filename)
    name, extension = os.path.splitext(filename)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    new_filename = f"{name}_{timestamp}{extension}"
    
    filepath = os.path.join(UPLOAD_FOLDER, new_filename)
    file.save(filepath)
    
    return filepath, None