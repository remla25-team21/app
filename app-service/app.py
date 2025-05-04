from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import requests
import json
from config import MODEL_SERVICE_URL, APP_VERSION  # TODO: Depends on external config module

# Import the version utility from libversion
try:
    from libversion import get_version
    LIB_VERSION_AVAILABLE = True
except ImportError:
    LIB_VERSION_AVAILABLE = False

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Swagger documentation
swagger_config = {
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
    "specs_route": "/apidocs/"  # Changed from "/docs/" to "/apidocs/"
}

swagger = Swagger(app, config=swagger_config, template={
    "info": {
        "title": "App Service API",
        "description": "API for the app service component",
        "version": APP_VERSION,
        "contact": {
            "name": "Team 21",
            "url": "https://github.com/remla25-team21"
        }
    }
})

# Get version information from libversion
def get_lib_version_info():
    """Get version information from libversion library."""
    if LIB_VERSION_AVAILABLE:
        try:
            version = get_version()
            return {
                "version": version,
                "name": "remla25-team21-lib-version",
                "status": "available"
            }
        except Exception as e:
            return {
                "name": "remla25-team21-lib-version",
                "status": "error",
                "error": str(e)
            }
    else:
        return {
            "name": "remla25-team21-lib-version",
            "status": "not installed",
            "error": "Library not available"
        }

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    ---
    responses:
      200:
        description: Service is healthy
    """
    return jsonify({"status": "ok"})

@app.route('/version', methods=['GET'])
def get_version_info():
    """
    Get app and model-service versions
    ---
    responses:
      200:
        description: Version information
    """
    # Get libversion info
    lib_version_info = get_lib_version_info()
    
    # TODO: Depends on model-service being available and exposing a /version endpoint
    try:
        model_response = requests.get(f"{MODEL_SERVICE_URL}/version", timeout=5)
        if model_response.status_code == 200:
            model_version = model_response.json()
        else:
            model_version = {"error": "Could not retrieve model service version"}
    except requests.RequestException:
        model_version = {"error": "Could not connect to model service"}
    
    return jsonify({
        "app_version": APP_VERSION,
        "model_service": model_version,
        "lib_version": lib_version_info
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Make a prediction using the model-service
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            data:
              type: string
              description: Input data for prediction
    responses:
      200:
        description: Prediction results
      400:
        description: Invalid input
      500:
        description: Error making prediction
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    
    # TODO: Depends on model-service being available and exposing a /predict endpoint
    try:
        # Forward the request to the model service
        model_response = requests.post(
            f"{MODEL_SERVICE_URL}/predict",
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        return jsonify(model_response.json()), model_response.status_code
        
    except requests.RequestException as e:
        return jsonify({"error": f"Error connecting to model service: {str(e)}"}), 500

if __name__ == '__main__':
    # For development only
    app.run(host='0.0.0.0', port=5000, debug=True)