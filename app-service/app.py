from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import requests
import json
from config import MODEL_SERVICE_URL, LIB_VERSION_AVAILABLE, get_app_version, SWAGGER_CONFIG, SWAGGER_TEMPLATE

# Try to import get_version if LIB_VERSION_AVAILABLE is True
if LIB_VERSION_AVAILABLE:
    try:
        from libversion import get_version
    except ImportError:
        get_version = None
else:
    get_version = None

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure Swagger documentation
swagger = Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

# Get version information from libversion
def get_lib_version_info():
    """Get version information from libversion library."""
    if LIB_VERSION_AVAILABLE and get_version:
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
    
    # Use lib_version for app_version
    app_version = get_app_version()
    
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
        "app_version": app_version,
        "model_service": model_version,
        "lib_version": lib_version_info  # NOTE: Same as app_version
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