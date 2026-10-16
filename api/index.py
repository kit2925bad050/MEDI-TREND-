import os
import sys

# Add the server folder to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
server_dir = os.path.join(current_dir, "..", "server")
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)

from app.main import app
