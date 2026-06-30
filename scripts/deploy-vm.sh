#!/bin/bash
# ThreatLens AI — one-shot VM deploy (Ubuntu 22.04+ on Oracle Cloud etc.)
# Usage: ./scripts/deploy-vm.sh

set -e

REPO="${THREATLENS_REPO:-https://github.com/johnadel112/ThreatLens-AI.git}"
DIR="${THREATLENS_DIR:-$HOME/ThreatLens-AI}"

echo "==> ThreatLens AI VM deploy"

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y docker.io docker-compose-v2 git curl
  sudo usermod -aG docker "$USER"
  echo ""
  echo "Docker installed. Log out and SSH back in, then run this script again:"
  echo "  ./deploy-vm.sh"
  exit 0
fi

if [ ! -d "$DIR" ]; then
  git clone "$REPO" "$DIR"
fi

cd "$DIR"
git pull --ff-only 2>/dev/null || true

PUBLIC_IP=$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
PUBLIC_HOST="${DUCKDNS_DOMAIN:-$PUBLIC_IP}"
DASHBOARD_URL="http://${PUBLIC_HOST}:3000"

if [ ! -f .env ]; then
  cp .env.example .env
fi

# CORS must match the URL you open in the browser (IP or DuckDNS hostname)
if ! grep -q "^CORS_ORIGIN=" .env 2>/dev/null; then
  echo "CORS_ORIGIN=${DASHBOARD_URL}" >> .env
elif [ -n "${DUCKDNS_DOMAIN:-}" ]; then
  if grep -q "^CORS_ORIGIN=" .env; then
    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=${DASHBOARD_URL}|" .env
  fi
fi

if ! grep -q "^JWT_SECRET=change-me" .env 2>/dev/null; then
  if command -v openssl >/dev/null 2>&1; then
    SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=${SECRET}" >> .env
  fi
fi

export CORS_ORIGIN="${DASHBOARD_URL}"

echo "==> Building and starting containers (MongoDB included)..."
docker compose up -d --build

echo "==> Waiting for backend..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if docker compose exec -T backend node -e "process.exit(0)" 2>/dev/null; then
    break
  fi
  sleep 3
done

echo ""
echo "============================================"
echo "ThreatLens AI is running (MongoDB in Docker)"
echo ""
echo "  Dashboard:  ${DASHBOARD_URL}"
echo "  Backend:    http://${PUBLIC_HOST}:4000/health"
echo "  Register a new account at ${DASHBOARD_URL}/register"
echo "============================================"
