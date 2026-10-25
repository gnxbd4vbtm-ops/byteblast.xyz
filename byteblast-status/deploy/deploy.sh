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

ssh "$REMOTE" "REMOTE_PROJECT='$REMOTE_PROJECT' bash -s" <<'EOF'
set -euo pipefail

ENV_FILE="$REMOTE_PROJECT/.env.local"
touch "$ENV_FILE"

set_env() {
    key="$1"
    value="$2"

    if grep -q "^${key}=" "$ENV_FILE"; then
        sed -i "s/^${key}=.*/${key}=${value}/" "$ENV_FILE"
    else
        printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    fi
}

set_env NODE_ENV production
set_env PORT 3000
set_env STATUS_PORT 3010
set_env DOWNLOADER_PORT 3020
EOF

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

echo "==> Installing downloader dependencies"

ssh "$REMOTE" "
    set -e
    cd '$REMOTE_PROJECT/byteblast-downloader'
    uv sync --frozen
"

echo "==> Restarting services"

ssh "$REMOTE" \
    "sudo systemctl restart byteblast-web byteblast-status byteblast-downloader"

echo "==> Checking services"

ssh "$REMOTE" \
    "systemctl is-active byteblast-web byteblast-status byteblast-downloader"

echo "==> Checking origins"

ssh "$REMOTE" \
    "curl --fail --silent --show-error --head http://127.0.0.1:3000 >/dev/null &&
     curl --fail --silent --show-error --head http://127.0.0.1:3010 >/dev/null &&
     curl --fail --silent --show-error http://127.0.0.1:3020/api/health >/dev/null"

echo
echo "Deployment successful."
echo "https://byteblast.xyz"
echo "https://status.byteblast.xyz"
echo "https://download.byteblast.xyz"
