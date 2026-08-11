#!/usr/bin/env bash
# Remark: deploy BMD ke https://bmd.andizero.my.id (SSH host: adwzero)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-adwzero}"
REMOTE_PATH="${REMOTE_PATH:-/srv/apps/web/bmd}"

cd "$ROOT"

echo "→ Building frontend…"
npm run build

echo "→ Rsync to ${REMOTE_HOST}:${REMOTE_PATH}…"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='vendor' \
  --exclude='.env' \
  --exclude='.env.backup' \
  --exclude='public/hot' \
  --exclude='public/storage' \
  --exclude='storage/logs/*' \
  --exclude='storage/framework/cache/data/*' \
  --exclude='storage/framework/sessions/*' \
  --exclude='storage/framework/views/*' \
  --exclude='storage/pail' \
  --exclude='storage/inertia-devtools' \
  --exclude='database/database.sqlite' \
  --exclude='database/database.sqlite-journal' \
  --exclude='dist' \
  --exclude='version' \
  --exclude='.DS_Store' \
  "$ROOT/" "${REMOTE_HOST}:${REMOTE_PATH}/"

echo "→ Composer + artisan on server…"
ssh "$REMOTE_HOST" "set -e
  cd ${REMOTE_PATH}
  docker run --rm -u \"\$(id -u):\$(id -g)\" -v ${REMOTE_PATH}:/app -w /app composer:2 \
    install --no-dev --optimize-autoloader --no-interaction --prefer-dist
  docker exec -u 1000:1000 -w /var/www/html/bmd caddy-php-1 php artisan migrate --force --ansi
  docker exec -u 1000:1000 -w /var/www/html/bmd caddy-php-1 php artisan storage:link --force --ansi
  docker exec -u 1000:1000 -w /var/www/html/bmd caddy-php-1 php artisan config:cache --ansi
  docker exec -u 1000:1000 -w /var/www/html/bmd caddy-php-1 php artisan route:cache --ansi
  docker exec -u 1000:1000 -w /var/www/html/bmd caddy-php-1 php artisan view:cache --ansi
"

echo "✓ Deployed → https://bmd.andizero.my.id"
