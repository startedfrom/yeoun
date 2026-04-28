import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const rootEnvPath = resolve(process.cwd(), '../../.env');
const localEnvPath = resolve(process.cwd(), '.env');

if (existsSync(rootEnvPath)) {
  loadDotenv({ path: rootEnvPath });
} else if (existsSync(localEnvPath)) {
  loadDotenv({ path: localEnvPath });
}

const apiEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/gamdojang'),
  JWT_SECRET: z.string().default('gamdojang_super_secret_key_for_dev_only'),
  /** 쉼표로 여러 출처 허용 (예: 모바일 번들, admin Vite) */
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:8081,http://localhost:5173,http://127.0.0.1:5173'),
  /** `true` / `false` 문자열. 미설정 시 development·test 에서만 시뮬 결제 허용 */
  PIECE_FIND_ALLOW_SIMULATED_PAYMENT: z.string().optional(),
  /** `1` 이면 리버스 프록시 뒤에서 request.ip / X-Forwarded-For 를 신뢰 */
  TRUST_PROXY: z.enum(['0', '1']).optional(),
  /** 관리자 라우트 분당 요청 상한(전역 100/min 과 별도로 더 타이트) */
  ADMIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  /** 쉼표 구분 IPv4/IPv6. 비우면 비활성(내부망 전제). 설정 시 목록 외 IP 는 403 */
  ADMIN_IP_ALLOWLIST: z.string().optional()
});

const parsed = apiEnvSchema.parse(process.env);

function pieceFindSimulatedPayments(): boolean {
  const v = parsed.PIECE_FIND_ALLOW_SIMULATED_PAYMENT;
  if (v === 'false' || v === '0') return false;
  if (v === 'true' || v === '1') return true;
  return parsed.APP_ENV === 'development' || parsed.APP_ENV === 'test';
}

export const env = {
  ...parsed,
  PIECE_FIND_ALLOW_SIMULATED_PAYMENT: pieceFindSimulatedPayments()
};
