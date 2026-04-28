/** 찰나 만료 시각(ISO) 기준 — 서버가 준 remainingSeconds가 지나도 클라에서 숨길 때 사용 */
export function isChalnaLiveByExpiresAt(expiresAt: string | undefined | null): boolean {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

export function chalnaSecondsRemainingFromExpiry(expiresAt: string): number {
  const ms = Date.parse(expiresAt) - Date.now();
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}
