#!/bin/sh

CONFIG_JS_PATH="/app/env-config.js"


API_URL_TO_USE=${APP_API_BASE_URL:-"http://localhost:5000"} 
FRONTEND_VERSION_TO_USE=${FRONTEND_VERSION:-"v_unknown"} 


# Create the env-config.js file
echo "window.APP_CONFIG = {" > "${CONFIG_JS_PATH}"
echo "  API_BASE_URL: \"${API_URL_TO_USE}\"," >> "${CONFIG_JS_PATH}"
echo "  FRONTEND_VERSION: \"${FRONTEND_VERSION_TO_USE}\"" >> "${CONFIG_JS_PATH}"
echo "};" >> "${CONFIG_JS_PATH}"

echo "Generated ${CONFIG_JS_PATH} with:"
echo "  API_BASE_URL: ${API_URL_TO_USE}"
echo "  FRONTEND_VERSION: ${FRONTEND_VERSION_TO_USE}"
echo "--- Content of ${CONFIG_JS_PATH} ---"
cat "${CONFIG_JS_PATH}"
echo "------------------------------------"


exec "$@"