#!/usr/bin/env bash
# Render Web Service start — keep in sync with render.yaml startCommand.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

corepack enable
corepack prepare pnpm@10.11.1 --activate

# deploy 슬러그에 dist 가 빠질 때: domain 은 DTS 제외 빌드만(빠름). tsup --dts 가 수십 초 걸려
# Start 타임아웃(No open ports → Application exited early) 로 죽는 것을 줄임.
if [ ! -f apps/api/dist/index.js ]; then
  echo "[render-api-start] apps/api/dist missing — fast rebuild (domain runtime emit only)"
  if [ ! -f node_modules/.modules.yaml ]; then
    pnpm install --frozen-lockfile
  fi
  pnpm --filter @gamdojang/domain run build:runtime
  pnpm --filter @gamdojang/api build
fi

pnpm --filter @gamdojang/api run start:render
