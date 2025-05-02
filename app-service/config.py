import os
from dotenv import load_dotenv

load_dotenv()

# Configuration settings
MODEL_SERVICE_URL = os.getenv('MODEL_SERVICE_URL', 'http://localhost:5001')  # TODO: Dummy URL, replace with actual model-service URL
APP_VERSION = os.getenv('APP_VERSION', '0.1.0')  # TODO: Dummy version, replace with actual app version

# For local development you can use a .env file
# In production, set environment variables directly