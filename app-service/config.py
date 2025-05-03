import os
from dotenv import load_dotenv

load_dotenv()

# Configuration settings
# MODEL_SERVICE_URL: The base URL for the model service. Update this value based on the deployment environment.
# - For local development, use a .env file to set MODEL_SERVICE_URL to the local service URL (e.g., http://localhost:5001).
# - For staging, set the MODEL_SERVICE_URL environment variable to the staging service URL (e.g., https://staging-model-service.example.com).
# - For production, set the MODEL_SERVICE_URL environment variable to the production service URL (e.g., https://model-service.example.com).
# Ensure the URL is accurate and accessible from the respective environment.
MODEL_SERVICE_URL = os.getenv('MODEL_SERVICE_URL', 'http://localhost:5001')  # Default to localhost for development
APP_VERSION = os.getenv('APP_VERSION', '0.1.0')  # TODO: Dummy version, replace with actual app version

# For local development you can use a .env file
# In production, set environment variables directly