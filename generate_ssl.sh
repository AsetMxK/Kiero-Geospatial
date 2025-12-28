#!/bin/bash
# Script to generate Self-Signed SSL Certificates

# Directory for keys
KEY_DIR="./keys/ssl"
mkdir -p $KEY_DIR

# Check if cert already exists
if [ -f "$KEY_DIR/nginx.crt" ]; then
    echo "⚠️  Certificate already exists."
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "🔐 Generating Self-Signed Certificate..."
# MSYS_NO_PATHCONV=1 prevents Git Bash from converting the subject to a file path
MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$KEY_DIR/nginx.key" \
    -out "$KEY_DIR/nginx.crt" \
    -subj "/C=ID/ST=DKI Jakarta/L=Jakarta/O=Kiero/OU=IT/CN=10.14.151.119"

echo "✅ Certificate generated at $KEY_DIR/nginx.crt"
echo "✅ Key generated at $KEY_DIR/nginx.key"
echo "ℹ️  Validity: 3650 days (10 years)"
