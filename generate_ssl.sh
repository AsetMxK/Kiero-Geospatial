#!/bin/bash
# 🐳 Optimized Self-Signed SSL Generator with SAN support

# 1. Deteksi IP Otomatis atau Gunakan Argumen
# Jika menjalankan ./generate_ssl.sh 1.2.3.4 maka akan pakai IP tersebut.
# Jika tidak, akan mendeteksi IP utama server.
DEFAULT_IP=$(hostname -I | awk '{print $1}')
SERVER_IP=${1:-$DEFAULT_IP}

KEY_DIR="./keys/ssl"
CONFIG_FILE="./keys/ssl/openssl.cnf"
mkdir -p $KEY_DIR

echo "🔍 Target IP: $SERVER_IP"

# 2. Buat file konfigurasi OpenSSL sementara
cat << EOC > $CONFIG_FILE
[req]
default_bits       = 2048
distinguished_name = req_distinguished_name
x509_extensions    = v3_req
prompt             = no

[req_distinguished_name]
C  = ID
ST = DKI Jakarta
L  = Jakarta
O  = Kiero Project
OU = IT Department
CN = $SERVER_IP

[v3_req]
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $SERVER_IP
IP.2 = 127.0.0.1
DNS.1 = localhost
EOC

echo "🔐 Generating SSL Certificate (Valid for 10 years)..."

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$KEY_DIR/nginx.key" \
    -out "$KEY_DIR/nginx.crt" \
    -config $CONFIG_FILE

# Hapus file konf sementara
rm $CONFIG_FILE

echo "✅ Success! Certificate generated for $SERVER_IP"
echo "📍 Location: $KEY_DIR/nginx.crt"
