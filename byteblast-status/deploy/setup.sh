#!/usr/bin/env bash
set -euo pipefail

PROJECT="/home/byte/Projects/byteblast.xyz"
STATUS="$PROJECT/byteblast-status"
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
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3000
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
ExecStart=/usr/bin/npm run start -- --hostname 127.0.0.1 --port 3010
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> Adding status.byteblast.xyz to Cloudflare Tunnel"

if ! sudo grep -q 'hostname: status.byteblast.xyz' "$TUNNEL_CONFIG"; then
    sudo sed -i \
        '/- service: http_status:404/i\  - hostname: status.byteblast.xyz\n    service: http://127.0.0.1:3010' \
        "$TUNNEL_CONFIG"
fi

echo "==> Validating Cloudflare configuration"
cloudflared tunnel --config "$TUNNEL_CONFIG" ingress validate

echo "==> Reloading systemd"
sudo systemctl daemon-reload

echo "==> Enabling services"
sudo systemctl enable byteblast-web byteblast-status cloudflared

echo "==> Restarting services"
sudo systemctl restart byteblast-web byteblast-status cloudflared

echo
echo "==> Service status"
systemctl --no-pager --full status byteblast-web byteblast-status cloudflared || true

echo
echo "Setup complete."
echo "Main:   http://127.0.0.1:3000"
echo "Status: http://127.0.0.1:3010"