from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import requests
import json
import os
from loguru import logger
import sys
from config import (
    LIB_VERSION_AVAILABLE, 
    get_app_version, 
    SWAGGER_CONFIG, 
    SWAGGER_TEMPLATE,
    get_model_service_url
)

# Configure loguru
logger.remove()  # Remove default handler

# Add stdout handler - this is what Docker will capture
logger.add(
    sys.stdout,
    colorize=True,  # Enable colors for better readability
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{function}</cyan>: {message}",
    level="INFO",
    backtrace=True,
    diagnose=True,
)

# Get MODEL_SERVICE_URL dynamically (can be updated at runtime via env var)
MODEL_SERVICE_URL = get_model_service_url()
logger.info("Current MODEL_SERVICE_URL: {}", MODEL_SERVICE_URL)
logger.info("Testing connection to model service at {}", MODEL_SERVICE_URL)

# Test the current MODEL_SERVICE_URL "/" endpoint
try:
    response = requests.get(f"{MODEL_SERVICE_URL}/", timeout=5)
    if response.status_code == 200:
        logger.info("Model service is reachable at {}", MODEL_SERVICE_URL)
    else:
        logger.error("Model service returned status code {}: {}", response.status_code, response.text)
except requests.RequestException as e:
    logger.error("Error connecting to model service: {}", str(e))
    # If the model service is not reachable, we can still start the app
    # but it will not be able to make predictions until the service is available

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

logger.info("App service started with MODEL_SERVICE_URL: {}", MODEL_SERVICE_URL)

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
            logger.error("Error getting version from lib-version: {}", str(e))
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
    logger.info("Health check request received")
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
    logger.info("Version info request received")
    
    # Get libversion info
    lib_version_info = get_lib_version_info()
    
    # Use lib_version for app_version
    app_version = get_app_version()
    
    try:
        logger.info("Requesting version from model-service at {}", MODEL_SERVICE_URL)
        model_response = requests.get(f"{MODEL_SERVICE_URL}/version", timeout=5)
        if model_response.status_code == 200:
            model_version = model_response.json()
            logger.info("Model service version received: {}", model_version)
        else:
            error_msg = f"Could not retrieve model service version (status code: {model_response.status_code})"
            logger.error(error_msg)
            model_version = {"error": error_msg}
    except requests.RequestException as e:
        error_msg = f"Could not connect to model service: {str(e)}"
        logger.error(error_msg)
        model_version = {"error": error_msg}
    
    response_data = {
        "app_version": app_version,
        "model_service": model_version,
        "lib_version": lib_version_info  # NOTE: Same as app_version
    }
    
    logger.info("Returning version info: {}", response_data)
    return jsonify(response_data)

@app.route('/predict', methods=['POST'])
def predict():
    """
    Make a prediction using the model-service
    ---
    tags:
      - Prediction
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            data:
              type: string
              example: "I love this product!"
          required:
            - data
    responses:
      200:
        description: Prediction successful
        schema:
          type: object
          properties:
            prediction:
              type: string
      400:
        description: Bad Request
      500:
        description: Internal Server Error
    """
    logger.info("Prediction request received")
    
    if not request.is_json:
        logger.warning("Prediction request not in JSON format")
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    
    # Check if data contains the expected 'data' field
    if 'data' not in data:
        logger.warning("Prediction request missing 'data' field")
        return jsonify({"error": "Missing 'data' field in request"}), 400
    
    # Log the received text (truncate if too long)
    input_text = data['data']
    log_text = input_text[:100] + "..." if len(input_text) > 100 else input_text
    logger.info("Processing prediction for text: '{}'", log_text)
    
    try:
        # Get the latest MODEL_SERVICE_URL value (in case it was changed)
        current_model_url = get_model_service_url()
        # Forward the request to the model service
        logger.info("Forwarding request to model service at {}", current_model_url)
        model_response = requests.post(
            f"{current_model_url}/predict",
            json=data,  # Keep the format as {"data": "input text"}
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if model_response.status_code == 200:
            prediction_result = model_response.json()
            logger.info("Prediction successful: {}", prediction_result)
        else:
            logger.error("Model service returned error status code: {}", model_response.status_code)
            logger.error("Model service error response: {}", model_response.text)
        
        return jsonify(model_response.json()), model_response.status_code
        
    except requests.RequestException as e:
        error_msg = f"Error connecting to model service: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

if __name__ == '__main__':
    # For development only
    logger.info("Starting Flask development server on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)