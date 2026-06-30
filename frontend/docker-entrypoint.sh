#!/bin/sh
set -e

API_TARGET="${API_URL:-}"

if [ -n "$BACKEND_HOST" ]; then
  API_TARGET="https://${BACKEND_HOST}/api"
fi

if [ -z "$API_TARGET" ]; then
  API_TARGET="/api"
fi

cat > /usr/share/nginx/html/config.js <<EOF
window.THREATLENS_CONFIG = {
  apiUrl: "${API_TARGET}",
};
EOF

echo "[frontend] API URL: ${API_TARGET}"
exec nginx -g 'daemon off;'
