#!/usr/bin/env bash
set -euo pipefail

echo "================================================"
echo " Host Setup: byteblast.xyz & Cloudflare Tunnel   "
echo "================================================"

APP_DIR="/home/byte/Projects/byteblast.xyz"

# 1. Install cloudflared if not present
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "--> Installing cloudflared daemon..."
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs 2>/dev/null || echo 'noble') main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
  sudo apt-get update -y
  sudo apt-get install -y cloudflared || {
    echo "Fallback to direct binary download..."
    curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
  }
else
  echo "✓ cloudflared is already installed: $(cloudflared --version)"
fi

# 2. Setup systemd service for byteblast-web
echo "--> Installing byteblast-web systemd service..."
sudo cp "$APP_DIR/deploy/byteblast-web.service" /etc/systemd/system/byteblast-web.service
sudo systemctl daemon-reload
sudo systemctl enable byteblast-web

# 3. Create cloudflared config directory
echo "--> Setting up Cloudflare tunnel configuration directory..."
sudo mkdir -p /etc/cloudflared
if [ ! -f /etc/cloudflared/config.yml ]; then
  sudo cp "$APP_DIR/deploy/cloudflare-tunnel.yml" /etc/cloudflared/config.yml
  echo "Created /etc/cloudflared/config.yml - Please edit with your tunnel UUID and credentials path."
fi


# 4. Instructions for Cloudflare tunnel creation
echo ""
echo "================================================"
echo " Setup complete! Next Cloudflare Tunnel steps: "
echo "================================================"
echo "1. Login to Cloudflare:"
echo "   cloudflared tunnel login"
echo ""
echo "2. Create tunnel:"
echo "   cloudflared tunnel create byteblast-tunnel"
echo ""
echo "3. Route DNS for apex, www, and status:"
echo "   cloudflared tunnel route dns byteblast-tunnel byteblast.xyz"
echo "   cloudflared tunnel route dns byteblast-tunnel www.byteblast.xyz"
echo "   cloudflared tunnel route dns byteblast-tunnel status.byteblast.xyz"
echo ""
echo "4. Update /etc/cloudflared/config.yml with your tunnel UUID."
echo ""
echo "5. Enable and start the cloudflared service:"
echo "   sudo cp $APP_DIR/deploy/cloudflared.service /etc/systemd/system/cloudflared.service"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable --now cloudflared"
echo "   sudo systemctl start byteblast-web"
echo "================================================"
