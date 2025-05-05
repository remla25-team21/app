import os
from dotenv import load_dotenv

# Import the version utility from libversion
try:
    from libversion import get_version
    LIB_VERSION_AVAILABLE = True
except ImportError:
    LIB_VERSION_AVAILABLE = False

load_dotenv()

# API Configuration settings
MODEL_SERVICE_URL = os.getenv('MODEL_SERVICE_URL', 'http://localhost:5001')  # TODO: Not Implemented

def get_app_version():
    """Get the application version from libversion."""
    if LIB_VERSION_AVAILABLE:
        try:
            return get_version()
        except Exception:
            return "UNKNOWN VERSION"  # Fallback version
    return "UNKNOWN VERSION"  # Fallback version

# Swagger configuration
SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,  # all routes
            "model_filter": lambda tag: True,  # all models
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"
}

SWAGGER_TEMPLATE = {
    "info": {
        "title": "App Service API",
        "description": "API for the app service component",
        "version": get_app_version(),
        "contact": {
            "name": "Team 21",
            "url": "https://github.com/remla25-team21"
        }
    }
}