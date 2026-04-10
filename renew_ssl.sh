#!/bin/bash
# 🔄 SSL Auto-Renewal Script for Self-Signed Certs

PROJECT_DIR="/home/icon/geomap"
CERT_FILE="$PROJECT_DIR/keys/ssl/nginx.crt"
DAYS_BEFORE_EXPIRY=30

echo "📅 Checking SSL certificate expiry..."

# 1. Cek apakah file sertifikat ada
if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate not found at $CERT_FILE. Generating new one..."
    cd $PROJECT_DIR && ./generate_ssl.sh
else
    # 2. Cek sisa umur sertifikat dalam detik
    # openssl x509 -checkend akan return 0 jika cert masih valid sampai N detik ke depan
    EXPIRY_SECONDS=$((DAYS_BEFORE_EXPIRY * 24 * 3600))
    
    if openssl x509 -checkend $EXPIRY_SECONDS -noout -in "$CERT_FILE"; then
        echo "✅ Certificate is still valid for more than $DAYS_BEFORE_EXPIRY days. No renewal needed."
        exit 0
    else
        echo "⚠️  Certificate is expiring soon (less than $DAYS_BEFORE_EXPIRY days). Renewing..."
        cd $PROJECT_DIR && ./generate_ssl.sh
    fi
fi

# 3. Salin ke direktori sistem Nginx (Requires sudo)
echo "📂 Copying new certificates to system directory..."
sudo cp "$PROJECT_DIR/keys/ssl/nginx.crt" /etc/ssl/certs/geomap-selfsigned.crt
sudo cp "$PROJECT_DIR/keys/ssl/nginx.key" /etc/ssl/private/geomap-selfsigned.key

# 4. Reload Nginx
echo "🚀 Reloading Nginx..."
sudo systemctl reload nginx

echo "✨ Renewal process completed successfully."
