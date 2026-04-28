#!/usr/bin/env bash
# 로컬에서 지정 TCP 포트의 LISTEN 프로세스를 종료합니다. 인자 없으면 4000(API 기본).
# macOS / Linux(lsof). Windows에서는 사용하지 마세요.
set -euo pipefail
PORT="${1:-4000}"
PIDS=$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)
if [[ -z "${PIDS}" ]]; then
  echo "[free-api-port] TCP:${PORT} LISTEN 프로세스 없음."
  exit 0
fi
echo "[free-api-port] TCP:${PORT} 사용 중 PID: ${PIDS} — 종료합니다."
kill -9 ${PIDS} 2>/dev/null || true
echo "[free-api-port] 정리 완료."
