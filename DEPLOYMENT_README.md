# Deployment Guide for Geomap App

This guide covers how to prepare, test, and deploy the application to a Linux server using Docker.

## 1. Prerequisites

### Local Machine (Windows)
- Docker Desktop installed and running.
- PowerShell or Terminal.
- Node.js.

### Remote Server (Linux)
- Ubuntu/Debian (recommended).
- Docker and Docker Compose plugin installed.
- **OpenSSL** (usually pre-installed) for generating certificates.
- **Ports**: Ensure ports 80 and 443 are open.

## 2. Configuration Setup

1.  **Environment Variables**:
    Copy the example file to `.env`:
    ```powershell
    cp .env.example .env
    ```
    Edit `.env` and fill in your real values.

2.  **Generate Gateway Keys (JWT)**:
    ```powershell
    cd geo-gateway
    npm install
    npm run generate_gateway_keys
    move gateway_private.pem ..\keys\
    move gateway_public.pem ..\keys\
    cd ..
    ```

3.  **Generate SSL Certificates (HTTPS)**:
    We use a shell script to generate a self-signed certificate valid for **10 years**.
    ```bash
    # Run locally (if you have git bash) or on server
    ./generate_ssl.sh
    # Result: keys/ssl/nginx.crt and keys/ssl/nginx.key
    ```

## 3. Local Testing & Development

To run the full stack locally with HTTPS and valid Auth, follow these steps:

1.  **Prepare Config**:
    Ensure you have a `.env` file with local DB credentials.
    ```powershell
    cp .env.example .env
    # Edit .env, ensure DB credentials match your local setup
    ```

2.  **Generate Certificates (HTTPS)**:
    ```powershell
    ./generate_ssl.sh
    # On Windows without Git Bash, you might need to run the openssl command manually (see script)
    ```

3.  **Phase 1: Start Gateway & Backend**:
    ```powershell
    docker compose up -d gateway backend
    ```

4.  **Phase 2: Register Local Client**:
    Wait for gateway to accept connections, then:
    ```powershell
    docker compose exec gateway npm run register_client
    # Enter Name: Local Dev
    # Enter Origins: https://localhost,http://localhost
    # COPY THE CLIENT ID
    ```

5.  **Phase 3: Update Config & Start Frontend**:
    -   Paste the `CLIENT_ID` into your local `.env` as `VITE_CLIENT_ID`.
    -   Start the frontend:
        ```powershell
        docker compose up -d --build frontend
        ```

6.  **Access**: Open `https://localhost` (Accept self-signed certificate warning).

## 4. Production Deployment

**Server Details**:
- **User**: icon
- **Password**: SSHPassword
- **IP**: 10.14.151.119

### Step 4.1: Prepare the Server
Since the server is empty, you need to install Docker.
Run these commands on the server (via SSH):

```bash
# 1. Update and install dependencies
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2. Add Docker GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Add Docker Repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Enable Docker for non-root user
sudo usermod -aG docker icon
# (You must logout and login again for this to take effect)

# 6. Create Project Directories
# Ensure the project folder and logs directory exist
mkdir -p /home/icon/geomap/logs
```

**Troubleshooting DNS**: If `apt-get` or `docker pull` fails with DNS errors:
```bash
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
sudo systemctl restart systemd-resolved
```

### Step 4.2: Clean File Transfer
Upload files using `robocopy` and `temp_upload` to strictly control what is sent (avoiding `node_modules` and dev files).

**Run in PowerShell (Local):**
```powershell
# Create clean temp folder
if (Test-Path "temp_upload") { Remove-Item "temp_upload" -Recurse -Force }
New-Item -ItemType Directory -Path "temp_upload"

# 1. Copy Folders (cleanly excluding dependencies)
robocopy backend temp_upload\backend /E /XD node_modules logs archives /XF .env*
robocopy frontend temp_upload\frontend /E /XD node_modules dist /XF .env*
robocopy geo-gateway temp_upload\geo-gateway /E /XD node_modules logs archives /XF .env*
robocopy keys temp_upload\keys /E

# 2. Copy Files
Copy-Item docker-compose.yml temp_upload\
Copy-Item generate_ssl.sh, renew_ssl.sh temp_upload\
Copy-Item .env temp_upload\.env

# Upload
scp -r temp_upload/* icon@10.14.151.119:/home/icon/geomap
scp -r temp_upload/.env icon@10.14.151.119:/home/icon/geomap
```

### Step 4.3: Deploy & Configure SSL
1.  **SSH into server**:
    ```powershell
    ssh icon@10.14.151.119
    cd /home/icon/geomap
    ```

2.  **Generate SSL Certs (One-time)**:
    ```bash
    chmod +x generate_ssl.sh renew_ssl.sh
    ./generate_ssl.sh
    # Verifies that keys/ssl/nginx.crt exists
    ```

3.  **Phase 1: Start Backend/Gateway**:
    ```bash
    docker compose up -d gateway backend
    ```

4.  **Phase 2: Register Client**:
    ```bash
    docker compose exec gateway npm run register_client
    # Enter Name: Geomap Frontend
    # Enter Origins: http://10.14.151.119,http://localhost,https://10.14.151.119,https://localhost
    # COPY THE CLIENT ID
    ```

5.  **Phase 3: Update .env & Build Frontend**:
    ```bash
    nano .env
    # Update VITE_CLIENT_ID=your_new_client_id
    # Save & Exit
    
    docker compose up -d --build frontend
    ```

### Step 4.4: Auto-Renewal (Maintenance)
The certificate is valid for 10 years, so "renewal" is rarely needed. However, to satisfy requirements or if you shorten the validity, you can use the renewal script.

**Manual Check**:
```bash
./renew_ssl.sh
# Checks expiry (< 30 days). If expiring, regenerates and restarts frontend.
```

**Auto-renewal via Cron (Optional)**:
Run every month:
```bash
crontab -e
# Add line:
0 0 1 * * /home/icon/geomap/renew_ssl.sh >> /home/icon/geomap/logs/ssl_renew.log 2>&1
```

## 5. Nginx & HTTPS Configuration

The Frontend Nginx (`frontend/nginx.conf`) is the single entry point for the application. It is configured to handle HTTPS, Reverse Proxying, and React SPA routing.

### 1. Security & HTTPS
-   **Force HTTPS**: Redirects all port 80 traffic to 443.
-   **Secure SSL**: Configured with TLS 1.2/1.3 and strong ciphers.
-   **Reverse Proxy**: Proxies `/api/`, `/oauth/`, and `/auth-proxy/` requests to the internal `gateway` container. This prevents **Mixed Content** errors.
-   **Health Check**: `/health` routes to `http://gateway:4000/health` for monitoring.

### 2. Frontend Features (SPA & Performance)
-   **SPA Routing**:
    ```nginx
    location / {
        try_files $uri $uri/ /index.html;
    }
    ```
    Ensures React Router handles client-side routing (e.g., `/dashboard`) without 404s on refresh.
-   **Compression (Gzip)**: Enabled for text, json, css, and js to improve load times.
-   **Caching**:
    -   Static Assets (Images, Fonts): 1 month.
    -   Bundled Code (JS/CSS): 1 year (immutable).

### Security Note
Ports for `gateway` and `backend` services are **hidden** in `docker-compose.yml`. Communication happens purely over the Docker internal network (`geomap_default`). The only exposed ports are 80 & 443 on the Frontend container.

## Appendix: Session Log (Troubleshooting & Decisions)

### 1. DNS Resolution Failure
**Issue**: `Temporary failure in name resolution` during `apt-get update`.
**Cause**: Server DNS configuration was unstable or blocking external domains.
**Fix**:
- Modifying `/etc/resolv.conf` to use Google DNS (`nameserver 8.8.8.8`).
- Updating `/etc/systemd/resolved.conf` with `DNS=8.8.8.8`.
- Restarting services: `systemctl restart systemd-resolved`.

### 2. Docker Permission Denied
**Issue**: `permission denied while trying to connect to the Docker daemon socket`.
**Cause**: User `icon` was not part of the `docker` group.
**Fix**:
- Executed: `sudo usermod -aG docker icon`.
- **Important**: Required logging out and logging back in for group changes to take effect.

### 3. File Transfer Optimization
**Issue**: `scp` was slow or failed because it tried to verify thousands of files in `node_modules`.
**Decision**: Adopted a **"Whitelist Strategy"** using `robocopy` with `temp_upload`.
**Fix**:
- Strictly copy ONLY `backend`, `frontend`, `geo-gateway`, `keys`, `docker-compose.yml`, scripts, and config.
- Explicitly exclude `node_modules`, `logs`, `archives`, `.git`.

### 4. Client Registration (Bootstrap)
**Issue**: The Frontend needs a `VITE_CLIENT_ID` that doesn't exist yet before deployment.
**Fix**: **Phased Deployment**.
- Phase 1: Deploy Gateway & Backend only.
- Phase 2: Run `npm run register_client` inside the Gateway container.
- Phase 3: Take the new Client ID -> update server `.env` -> Build Frontend.

### 5. HTTPS & Mixed Content
**Issue**: Browser blocked API requests because Frontend was loaded via HTTPS (manually) but API calls were HTTP.
**Fix**: **Nginx Reverse Proxy**.
- Configured Nginx (Frontend) to listen on 443.
- Added `location /api/` and `location /oauth/` in `nginx.conf` to proxy requests to `http://gateway:4000`.
- Browser sees everything as HTTPS (`origin` matches), solving Mixed Content errors.
