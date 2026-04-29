#!/usr/bin/env bash
# Render Web Service start — keep in sync with render.yaml startCommand.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

corepack enable
corepack prepare pnpm@10.11.1 --activate

# Render 런타임 번들이 .gitignore 의 dist 로 빠지는 경우가 있어 dist 가 없으면 여기서 다시 빌드합니다.
if [ ! -f apps/api/dist/index.js ]; then
  echo "[render-api-start] apps/api/dist missing — rebuilding (ignored dist omitted from deploy slug)"
  if [ ! -f node_modules/.modules.yaml ]; then
    pnpm install --frozen-lockfile
  fi
  pnpm --filter @gamdojang/domain build
  pnpm --filter @gamdojang/api build
fi

pnpm --filter @gamdojang/api run start:render
