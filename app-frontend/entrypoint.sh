#!/bin/sh

CONFIG_JS_PATH="/app/env-config.js"


API_URL_TO_USE=${APP_API_BASE_URL:-"http://localhost:5000"} 

# Create the env-config.js file
echo "window.APP_CONFIG = {" > "${CONFIG_JS_PATH}"
echo "  API_BASE_URL: \"${API_URL_TO_USE}\"" >> "${CONFIG_JS_PATH}"
echo "};" >> "${CONFIG_JS_PATH}"

echo "Generated ${CONFIG_JS_PATH} with API_BASE_URL: ${API_URL_TO_USE}"
echo "--- Content of ${CONFIG_JS_PATH} ---"
cat "${CONFIG_JS_PATH}" # Output content for verification in logs
echo "------------------------------------"

exec "$@"