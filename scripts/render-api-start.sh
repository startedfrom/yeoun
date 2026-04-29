#!/usr/bin/env bash
# Render start: dist 슬러그 누락으로 tsc 재실행하면 포트가 늦게 열려 timeout 남 → API 는 tsx 로 src 실행.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

corepack enable
corepack prepare pnpm@10.11.1 --activate

# @gamdojang/domain 은 package exports 가 dist 를 가리키므로 ESM 출력만 필요
if [ ! -f packages/domain/dist/index.js ]; then
  echo "[render-api-start] packages/domain/dist missing — build:runtime"
  pnpm --filter @gamdojang/domain run build:runtime
fi

pnpm --filter @gamdojang/api run start:render
