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
DEFAULT_MODEL_PORT = 4000
DEFAULT_MODEL_HOST = 'model-service'  # For docker network

# Get MODEL_SERVICE_URL from environment with fallback
def get_model_service_url():
    """
    Get the MODEL_SERVICE_URL from environment with fallback based on hostname.
    
    Returns:
        str: The model service URL
    """
    # First check for runtime environment variable
    url = os.environ.get('MODEL_SERVICE_URL')
    
    if not url:
        # Check if we're running locally
        hostname = os.environ.get('HOSTNAME', '')
        is_local = hostname == 'localhost' or hostname.startswith('127.0.0.1')
        
        if is_local:
            url = f'http://localhost:{DEFAULT_MODEL_PORT}'  # For local development
        else:
            url = f'http://{DEFAULT_MODEL_HOST}:{DEFAULT_MODEL_PORT}'  # For docker network
    
    # Validate URL format (basic check)
    if not url.startswith(('http://', 'https://')):
        logging.warning(f"Invalid MODEL_SERVICE_URL: {url}. It should start with 'http://' or 'https://'.")
    
    return url

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