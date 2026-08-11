#!/usr/bin/env bash
# Remark: buat zip source Laravel agar tim bisa download & develop (tanpa vendor/node_modules).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M)"
OUT_DIR="${ROOT}/dist"
ZIP_NAME="bmd-source-${STAMP}.zip"
ZIP_PATH="${OUT_DIR}/${ZIP_NAME}"

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

echo "→ Packing ${ZIP_NAME}…"

zip -r "$ZIP_PATH" . \
  -x "vendor/*" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "version/*" \
  -x "*.zip" \
  -x ".env" \
  -x ".env.backup" \
  -x ".env.production" \
  -x "public/hot" \
  -x "public/storage" \
  -x "public/build/*" \
  -x "storage/logs/*" \
  -x "storage/framework/cache/*" \
  -x "storage/framework/sessions/*" \
  -x "storage/framework/views/*" \
  -x "storage/pail/*" \
  -x "storage/inertia-devtools/*" \
  -x "database/database.sqlite" \
  -x "database/database.sqlite-journal" \
  -x ".DS_Store" \
  -x "**/.DS_Store"

echo "✓ ${ZIP_PATH}"
ls -lh "$ZIP_PATH"
echo
echo "Tim: unzip → composer run setup → php artisan storage:link → php artisan db:seed"
