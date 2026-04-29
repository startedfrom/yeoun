#!/usr/bin/env bash
# Render Web Service start — keep in sync with render.yaml startCommand.
set -euo pipefail
corepack enable
corepack prepare pnpm@10.11.1 --activate
pnpm --filter @gamdojang/api run start:render
