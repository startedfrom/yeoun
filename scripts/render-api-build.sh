#!/usr/bin/env bash
# Render 빌드: 시작은 tsx(src) 로 dist 필요 없음. domain 번들만 맞추면 됨 (api tsc 제거해 빌드·압축 시간 단축).
set -euo pipefail
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install --frozen-lockfile
pnpm --filter @gamdojang/domain build
pnpm --filter @gamdojang/api exec prisma generate
