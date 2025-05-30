from flask import Flask, jsonify, request
from flask_cors import CORS
from flasgger import Swagger
import requests
import json
import os
from loguru import logger
import sys
import time
from prometheus_client import Counter, Gauge, Histogram, make_wsgi_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
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

# Initialize Prometheus metrics
# 1. Counter for tracking total number of predictions
PREDICTION_COUNT = Counter(
    'sentiment_predictions_total', 
    'Total number of sentiment predictions made',
    ['sentiment']  # Label to track positive vs negative predictions
)
# Initialize common sentiment labels to ensure they appear in /metrics from the start
PREDICTION_COUNT.labels(sentiment='positive').inc(0)
PREDICTION_COUNT.labels(sentiment='negative').inc(0)
PREDICTION_COUNT.labels(sentiment='unknown').inc(0)

# 2. Gauge for tracking ratio of positive to negative sentiments
SENTIMENT_RATIO = Gauge(
    'sentiment_positive_ratio',
    'Ratio of positive to total sentiments (0-1)'
)

# 3. Histogram for tracking prediction response time
PREDICTION_LATENCY = Histogram(
    'sentiment_prediction_latency_seconds',
    'Time taken to process a sentiment prediction',
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]  # Buckets in seconds
)

# 4. Counter for tracking model usage (predict calls)
USER_CLICKS = Counter(
    'model_usage_total',
    'Total number of model prediction requests',
    ['experiment_variant']  # Label for A/B test variant
)

# 5. Histogram for tracking user session duration (continuous experimentation)
SESSION_DURATION = Histogram(
    'user_session_duration_seconds',
    'Duration of user sessions in seconds',
    buckets=[10, 30, 60, 120, 300, 600, 1200, 1800, 3600]  # Buckets for session length
)

# Initialize counters for calculating the ratio
# Note: These global variables may not behave as expected in a multi-worker setup
# without specific prometheus_client multi-process configuration.
positive_count = 0
total_count = 0

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

# Add Prometheus WSGI middleware to expose metrics
app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
    '/metrics': make_wsgi_app()
})

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
            experiment_variant:
              type: string
              example: "variant_a"
              description: "A/B test variant identifier (optional)"
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
    
    # Start timing for latency histogram
    start_time = time.time()
    
    if not request.is_json:
        logger.warning("Prediction request not in JSON format")
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    
    # Check if data contains the expected 'data' field
    if 'data' not in data:
        logger.warning("Prediction request missing 'data' field")
        return jsonify({"error": "Missing 'data' field in request"}), 400
    
    # Extract experiment variant for tracking model usage
    experiment_variant = data.get('experiment_variant', 'control')
    
    # Track model usage (user clicks)
    USER_CLICKS.labels(experiment_variant=experiment_variant).inc()
    
    # Log the received text (truncate if too long)
    input_text = data['data']
    log_text = input_text[:100] + "..." if len(input_text) > 100 else input_text
    logger.info("Processing prediction for text: '{}', variant: '{}'", log_text, experiment_variant)
    
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
            
            # Update metrics for successful predictions
            original_sentiment_val = prediction_result.get("prediction", "unknown")
            
            # Normalize sentiment:
            # Convert to lowercase string to handle "0"/"1" (str or int) 
            # and "positive"/"negative" (case-insensitive).
            normalized_input_str = str(original_sentiment_val).lower()

            final_sentiment_label: str
            if normalized_input_str == "1" or normalized_input_str == "positive":
                final_sentiment_label = "positive"
            elif normalized_input_str == "0" or normalized_input_str == "negative":
                final_sentiment_label = "negative"
            else:
                # This covers "unknown" from .get() or any other unexpected values.
                final_sentiment_label = "unknown"
                # Log a warning if the original value was not 'unknown' and didn't map to positive/negative.
                if normalized_input_str != "unknown":
                    logger.warning(
                        f"Unexpected sentiment value '{original_sentiment_val}' received from model. "
                        f"Normalized to '{final_sentiment_label}' for metrics."
                    )
            
            # 1. Update the prediction counter with the normalized sentiment label
            PREDICTION_COUNT.labels(sentiment=final_sentiment_label).inc()

            # 2. Update the positive/negative ratio
            global positive_count, total_count
            total_count += 1
            if final_sentiment_label == "positive": 
                positive_count += 1
            
            # Update the gauge with the new ratio
            if total_count > 0:
                SENTIMENT_RATIO.set(positive_count / total_count)
            else:
                SENTIMENT_RATIO.set(0)
        else:
            logger.error("Model service returned error status code: {}", model_response.status_code)
            logger.error("Model service error response: {}", model_response.text)
        
        # Calculate elapsed time and record in the histogram
        elapsed_time = time.time() - start_time
        PREDICTION_LATENCY.observe(elapsed_time)
        
        return jsonify(model_response.json()), model_response.status_code
        
    except requests.RequestException as e:
        error_msg = f"Error connecting to model service: {str(e)}"
        logger.error(error_msg)
        
        # Record the latency even for errors
        elapsed_time = time.time() - start_time
        PREDICTION_LATENCY.observe(elapsed_time)
        
        return jsonify({"error": error_msg}), 500

@app.route('/metrics-info', methods=['GET'])
def metrics_info():
    """
    Get information about available metrics
    ---
    responses:
      200:
        description: Metrics information
    """
    metrics_description = {
        "metrics_endpoint": "/metrics",
        "available_metrics": [
            {
                "name": "sentiment_predictions_total",
                "type": "Counter",
                "description": "Total number of sentiment predictions made",
                "labels": ["sentiment"]
            },
            {
                "name": "sentiment_positive_ratio",
                "type": "Gauge",
                "description": "Ratio of positive to total sentiments (0-1). Note: In multi-worker setups, this reflects worker-local state unless PROMETHEUS_MULTIPROC_DIR is configured."
            },
            {
                "name": "sentiment_prediction_latency_seconds",
                "type": "Histogram",
                "description": "Time taken to process a sentiment prediction",
                "buckets": [0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
            },
            {
                "name": "model_usage_total",
                "type": "Counter",
                "description": "Total number of model prediction requests for continuous experimentation",
                "labels": ["experiment_variant"]
            },
            {
                "name": "user_session_duration_seconds",
                "type": "Histogram",
                "description": "Duration of user sessions in seconds for continuous experimentation",
                "buckets": [10, 30, 60, 120, 300, 600, 1200, 1800, 3600]
            }
        ]
    }
    return jsonify(metrics_description)

@app.route('/track/click', methods=['POST'])
def track_click():
    """
    Track model usage (deprecated - use /predict with experiment_variant instead)
    ---
    tags:
      - Analytics
    deprecated: true
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            experiment_variant:
              type: string
              example: "variant_a"
              description: "A/B test variant identifier"
    responses:
      200:
        description: Model usage tracked successfully
      400:
        description: Bad Request
    """
    logger.info("Model usage tracking request received (deprecated endpoint)")
    
    if not request.is_json:
        logger.warning("Model usage tracking request not in JSON format")
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    experiment_variant = data.get('experiment_variant', 'control')
    
    # Record the model usage
    USER_CLICKS.labels(experiment_variant=experiment_variant).inc()
    
    logger.info("Model usage tracked: experiment_variant='{}'", experiment_variant)
    
    return jsonify({
        "status": "success",
        "message": "Model usage tracked successfully (deprecated - use /predict endpoint instead)",
        "experiment_variant": experiment_variant
    })

@app.route('/track/session', methods=['POST'])
def track_session():
    """
    Track user session duration for continuous experimentation
    ---
    tags:
      - Analytics
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            duration:
              type: number
              example: 120.5
              description: "Session duration in seconds"
            experiment_variant:
              type: string
              example: "variant_a"
              description: "A/B test variant identifier"
          required:
            - duration
    responses:
      200:
        description: Session duration tracked successfully
      400:
        description: Bad Request
    """
    logger.info("Session tracking request received")
    
    if not request.is_json:
        logger.warning("Session tracking request not in JSON format")
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    
    if 'duration' not in data:
        logger.warning("Session tracking request missing 'duration' field")
        return jsonify({"error": "Missing 'duration' field in request"}), 400
    
    try:
        duration = float(data['duration'])
        if duration < 0:
            logger.warning("Invalid session duration: {}", duration)
            return jsonify({"error": "Duration must be non-negative"}), 400
    except (ValueError, TypeError):
        logger.warning("Invalid duration format: {}", data['duration'])
        return jsonify({"error": "Duration must be a valid number"}), 400
    
    experiment_variant = data.get('experiment_variant', 'control')  # Default to 'control'
    
    # Record the session duration
    SESSION_DURATION.observe(duration)
    
    logger.info("Session tracked: duration={}s, experiment_variant='{}'", duration, experiment_variant)
    
    return jsonify({
        "status": "success", 
        "message": "Session duration tracked successfully",
        "duration": duration,
        "experiment_variant": experiment_variant
    })

if __name__ == '__main__':
    # For development only
    logger.info("Starting Flask development server on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=True)