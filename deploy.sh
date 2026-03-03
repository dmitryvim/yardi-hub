#!/usr/bin/env bash
set -euo pipefail

SERVER="ubuntu@yardi.dmitrylabs.com"
REMOTE_DIR="~/yardi"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

HUB_IMAGE="ghcr.io/dmitryvim/yardi-hub:latest"
MIGRATE_IMAGE="ghcr.io/dmitryvim/yardi-hub:migrate"

# --- Build & push hub images ---
echo "==> Building hub image..."
docker build --platform linux/amd64 -t "$HUB_IMAGE" --target runner "$SCRIPT_DIR"

echo "==> Building migrate image..."
docker build --platform linux/amd64 -t "$MIGRATE_IMAGE" --target migrator "$SCRIPT_DIR"

echo "==> Pushing images to ghcr.io..."
docker push "$HUB_IMAGE"
docker push "$MIGRATE_IMAGE"

# --- Deploy to server ---
echo "==> Copying docker-compose.yml to server..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
scp "$SCRIPT_DIR/docker-compose.yml" "$SERVER:$REMOTE_DIR/docker-compose.yml"
scp "$SCRIPT_DIR/.env.example" "$SERVER:$REMOTE_DIR/.env.example"

# Check .env exists on server
ssh "$SERVER" "test -f $REMOTE_DIR/.env" || {
  echo "ERROR: $REMOTE_DIR/.env not found on server."
  echo "SSH in and create it from .env.example:"
  echo "  ssh $SERVER 'cp $REMOTE_DIR/.env.example $REMOTE_DIR/.env && nano $REMOTE_DIR/.env'"
  exit 1
}

echo "==> Pulling images and restarting services..."
ssh "$SERVER" "cd $REMOTE_DIR && docker compose pull && docker compose up -d"

echo "==> Services:"
ssh "$SERVER" "cd $REMOTE_DIR && docker compose ps"
echo "Done!"
