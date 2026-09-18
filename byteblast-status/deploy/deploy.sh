#!/usr/bin/env bash
set -euo pipefail

REMOTE="byte@10.42.0.243"
LOCAL="/home/byte/Projects/byteblast.xyz"
REMOTE_PROJECT="/home/byte/Projects/byteblast.xyz"

echo "==> Syncing project to iMac"

rsync -az --delete \
    --exclude='.git/' \
    --exclude='.next/' \
    --exclude='node_modules/' \
    "$LOCAL/" "$REMOTE:$REMOTE_PROJECT/"

echo "==> Setting production environment"

ssh "$REMOTE" \
    "sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' '$REMOTE_PROJECT/.env.local'"

echo "==> Installing dependencies and building main site"

ssh "$REMOTE" "
    set -e
    cd '$REMOTE_PROJECT'
    npm ci
    npm run build
"

echo "==> Installing dependencies and building status site"

ssh "$REMOTE" "
    set -e
    cd '$REMOTE_PROJECT/byteblast-status'
    npm ci
    npm run build
"

echo "==> Restarting services"

ssh "$REMOTE" \
    "sudo systemctl restart byteblast-web byteblast-status"

echo "==> Checking services"

ssh "$REMOTE" \
    "systemctl is-active byteblast-web byteblast-status"

echo "==> Checking origins"

ssh "$REMOTE" \
    "curl --fail --silent --show-error --head http://127.0.0.1:3000 >/dev/null &&
     curl --fail --silent --show-error --head http://127.0.0.1:3010 >/dev/null"

echo
echo "Deployment successful."
echo "https://byteblast.xyz"
echo "https://status.byteblast.xyz"