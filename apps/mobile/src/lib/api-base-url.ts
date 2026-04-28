import Constants from 'expo-constants';

function readExtraApiBase(): string | undefined {
  const a = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  if (typeof a?.apiBaseUrl === 'string' && a.apiBaseUrl.length > 0) return a.apiBaseUrl;
  // 구형/웹 등에서 expoConfig 대신 manifest만 채워지는 경우
  const m = Constants.manifest as { extra?: Record<string, unknown> } | null;
  const b = m?.extra;
  if (typeof b?.apiBaseUrl === 'string' && b.apiBaseUrl.length > 0) return b.apiBaseUrl;
  return undefined;
}

/** 호스트만 있고 /api/v1 이 빠지면 GET …/piece-find/next 가 404가 된다. */
function ensureApiVersionPath(base: string): string {
  const trimmed = base.replace(/\/+$/, '');
  if (/\/api\/v\d+$/i.test(trimmed)) return trimmed;
  if (/\/api\//i.test(trimmed)) return trimmed;
  // http://host:4000 처럼 경로 없음 → /api/v1 붙임
  try {
    const u = new URL(trimmed);
    if (!u.pathname || u.pathname === '/') {
      return `${trimmed.replace(/\/+$/, '')}/api/v1`;
    }
  } catch {
    /* ignore */
  }
  return trimmed;
}

/**
 * API 베이스 URL. 매 호출 시 읽는다(모듈 로드 시점에 Constants가 비는 경우 방지).
 * 우선순위: EXPO_PUBLIC_API_URL → EXPO_PUBLIC_API_BASE_URL → app.config extra → 기본값
 */
export function getApiBaseUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL;
  const fromExtra = readExtraApiBase();
  let raw = fromEnv || fromExtra || 'http://localhost:4000/api/v1';

  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    const isLocal = h === 'localhost' || h === '127.0.0.1';
    if (!isLocal && (raw.includes('localhost') || raw.includes('127.0.0.1'))) {
      // eslint-disable-next-line no-console
      console.warn(
        '[gamdojang] 웹 프로덕션에서 API가 localhost로 설정됐습니다. Vercel → Settings → Environment Variables에 EXPO_PUBLIC_API_BASE_URL(또는 EXPO_PUBLIC_API_URL)을 프로덕션 API 풀 URL(…/api/v1)로 넣고 재배포하세요.'
      );
    }
  }
  const url = ensureApiVersionPath(raw);
  if (__DEV__ && url !== raw) {
    // eslint-disable-next-line no-console
    console.warn('[gamdojang] API URL에 /api/v1 을 붙였어요:', raw, '→', url);
  }
  if (__DEV__ && !fromEnv && !fromExtra) {
    // eslint-disable-next-line no-console
    console.warn('[gamdojang] API URL: env/extra 없음 → 기본값 사용 →', url);
  }
  return url;
}
