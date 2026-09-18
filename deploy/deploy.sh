#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/byte/Projects/byteblast.xyz"
SERVICE_NAME="byteblast-web"
HEALTH_URL="http://127.0.0.1:3000/api/health"

echo "================================================"
echo " Starting production deployment for byteblast.xyz "
echo "================================================"

cd "$APP_DIR"

# 1. Pull latest changes if tracking remote branch
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "--> Fetching latest git commits..."
  git pull --ff-only || echo "Note: Git pull skipped or not configured for tracking branch."
fi

# 2. Ensure dependencies are up-to-date
echo "--> Installing dependencies..."
npm install --prefer-offline

# 3. Build Next.js application
echo "--> Building Next.js production bundle..."
npm run build

# 4. Ensure data directory & SQLite permissions
echo "--> Verifying SQLite data directory..."
mkdir -p "$APP_DIR/data"
chmod 750 "$APP_DIR/data"
if [ -f "$APP_DIR/data/byteblast.db" ]; then
  chmod 640 "$APP_DIR/data/byteblast.db"
fi

# 5. Restart application service
echo "--> Restarting $SERVICE_NAME systemd service..."
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl restart "$SERVICE_NAME"
  echo "--> Waiting for application to report healthy..."
  sleep 2

  ATTEMPTS=0
  MAX_ATTEMPTS=15
  until curl -s -f "$HEALTH_URL" >/dev/null 2>&1 || [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; do
    echo "    Waiting for health endpoint ($ATTEMPTS/$MAX_ATTEMPTS)..."
    sleep 1
    ATTEMPTS=$((ATTEMPTS + 1))
  done

  if curl -s -f "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✓ Health check passed successfully!"
  else
    echo "WARNING: Health check failed or timed out. Check journalctl -u $SERVICE_NAME -n 50"
    exit 1
  fi
else
  echo "systemctl not found. Service restart skipped."
fi

echo "================================================"
echo " Deployment completed successfully! "
echo "================================================"
