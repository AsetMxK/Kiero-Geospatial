#!/bin/bash
CERT_FILE="./keys/ssl/nginx.crt"

if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate not found! Generating new one..."
    ./generate_ssl.sh
    exit 0
fi

# Check expiration
EXP_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
echo "📅 Current Certificate Expiry: $EXP_DATE"

# Convert to timestamp
EXP_EPOCH=$(date -d "$EXP_DATE" +%s)
NOW_EPOCH=$(date +%s)
# 30 days = 2592000 seconds
SAFE_MARGIN=2592000

DIFF=$((EXP_EPOCH - NOW_EPOCH))

if [ $DIFF -lt $SAFE_MARGIN ]; then
    echo "⚠️  Certificate is expiring soon/expired. Renewing..."
    # Automate "yes" to overwrite prompt
    echo "y" | ./generate_ssl.sh
    
    echo "📄 Copying certs to /etc/ssl..."
    sudo cp ./keys/ssl/nginx.crt /etc/ssl/certs/geomap-selfsigned.crt
    sudo cp ./keys/ssl/nginx.key /etc/ssl/private/geomap-selfsigned.key

    echo "🔄 Reloading Nginx Global to apply new cert..."
    sudo systemctl reload nginx
    echo "✅ Renewal Complete!"
else
    DAYS=$((DIFF / 86400))
    echo "✅ Certificate is valid for another $DAYS days. No action needed."
fi
