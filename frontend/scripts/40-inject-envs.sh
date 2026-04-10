#!/bin/sh
# ---------------------------------------------------------------------------
# 40-inject-envs.sh (Dynamic Version)
# ---------------------------------------------------------------------------
# This script runs before Nginx starts. It scans built files for 
# placeholders (__VITE_VAR_NAME__) and replaces them with system ENV variables.
# ---------------------------------------------------------------------------

set -e

TARGET_DIR="/usr/share/nginx/html"

echo "Starting Dynamic Runtime Environment Injection..."

# Loop through all environment variables starting with VITE_
for var in $(env | grep '^VITE_'); do
    # Extract name and value
    key=$(echo "$var" | cut -d '=' -f 1)
    value=$(echo "$var" | cut -d '=' -f 2-)

    if [ -n "$value" ]; then
        echo "  Injecting $key..."
        
        # Handle Base Path variables with a Vite-safe placeholder pattern (/___VAR___/)
        # This ensures asset paths are correct even if the user forgets or adds extra slashes in .env
        if [ "$key" = "VITE_APP_BASE_URL" ] || [ "$key" = "VITE_BASE_PATH" ]; then
            placeholder="/___${key}___/"
            # Normalize value: ensure it starts and ends with a single slash
            value=$(echo "/$value/" | sed 's|//*|/|g')
        else
            placeholder="__${key}__"
        fi
        
        # Use sed with | delimiter to safely handle URLs/Slashes
        find "$TARGET_DIR" -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) \
            -exec sed -i "s|$placeholder|$value|g" {} +
    fi
done

echo "Injection Complete."
