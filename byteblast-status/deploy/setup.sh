#!/usr/bin/env bash
set -euo pipefail

PROJECT="/home/byte/Projects/byteblast.xyz"
STATUS="$PROJECT/byteblast-status"
DOWNLOADER="$PROJECT/byteblast-downloader"
TUNNEL_CONFIG="/etc/cloudflared/config.yml"

echo "==> Installing production dependencies"
cd "$PROJECT"
npm ci

echo "==> Building byteblast.xyz"
npm run build

echo "==> Installing status dependencies"
cd "$STATUS"
npm ci

echo "==> Building status.byteblast.xyz"
npm run build

echo "==> Installing downloader dependencies"
cd "$DOWNLOADER"
uv sync --frozen

echo "==> Creating main website service"
sudo tee /etc/systemd/system/byteblast-web.service >/dev/null <<'EOF'
[Unit]
Description=byteblast.xyz Next.js Production Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=byte
Group=byte
WorkingDirectory=/home/byte/Projects/byteblast.xyz
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port ${PORT}
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> Creating status website service"
sudo tee /etc/systemd/system/byteblast-status.service >/dev/null <<'EOF'
[Unit]
Description=status.byteblast.xyz Next.js Production Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=byte
Group=byte
WorkingDirectory=/home/byte/Projects/byteblast.xyz/byteblast-status
Environment=NODE_ENV=production
Environment=STATUS_PORT=3010
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port ${STATUS_PORT}
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> Creating downloader service"
sudo tee /etc/systemd/system/byteblast-downloader.service >/dev/null <<'EOF'
[Unit]
Description=download.byteblast.xyz FastAPI Production Service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=byte
Group=byte
SupplementaryGroups=render
WorkingDirectory=/home/byte/Projects/byteblast.xyz/byteblast-downloader
Environment=HOST=127.0.0.1
Environment=PORT=3020
EnvironmentFile=-/home/byte/Projects/byteblast.xyz/byteblast-downloader/.env.local
ExecStart=/home/byte/Projects/byteblast.xyz/byteblast-downloader/.venv/bin/uvicorn app.main:app --host ${HOST} --port ${PORT} --proxy-headers --forwarded-allow-ips=127.0.0.1
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/tmp/byteblast-downloads
PrivateDevices=false
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
RestrictNamespaces=true
SystemCallArchitectures=native

[Install]
WantedBy=multi-user.target
EOF

echo "==> Adding ByteBlast sites to Cloudflare Tunnel"

if ! sudo grep -q 'hostname: status.byteblast.xyz' "$TUNNEL_CONFIG"; then
    sudo sed -i \
        '/- service: http_status:404/i\  - hostname: status.byteblast.xyz\n    service: http://127.0.0.1:3010' \
        "$TUNNEL_CONFIG"
fi

if ! sudo grep -q 'hostname: download.byteblast.xyz' "$TUNNEL_CONFIG"; then
    sudo sed -i \
        '/- service: http_status:404/i\  - hostname: download.byteblast.xyz\n    service: http://127.0.0.1:3020' \
        "$TUNNEL_CONFIG"
fi

echo "==> Validating Cloudflare configuration"
cloudflared tunnel --config "$TUNNEL_CONFIG" ingress validate

echo "==> Reloading systemd"
sudo systemctl daemon-reload

echo "==> Enabling services"
sudo systemctl enable byteblast-web byteblast-status byteblast-downloader cloudflared

echo "==> Restarting services"
sudo systemctl restart byteblast-web byteblast-status byteblast-downloader cloudflared

echo
echo "==> Service status"
systemctl --no-pager --full status byteblast-web byteblast-status byteblast-downloader cloudflared || true

echo
echo "Setup complete."
echo "Main:   http://127.0.0.1:3000"
echo "Status: http://127.0.0.1:3010"
echo "Download: http://127.0.0.1:3020"
