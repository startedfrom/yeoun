#!/usr/bin/env bash
# Render Web Service build — do not append other commands in the dashboard.
set -euo pipefail
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm install --frozen-lockfile
pnpm --filter @gamdojang/domain build
pnpm --filter @gamdojang/api build
