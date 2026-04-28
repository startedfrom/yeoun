import { buildApp } from './app.js';
import { env } from './env.js';

const app = await buildApp();

try {
  await app.listen({
    host: env.API_HOST,
    port: env.API_PORT
  });
} catch (e) {
  const err = e as NodeJS.ErrnoException & { code?: string };
  if (err.code === 'EADDRINUSE') {
    console.error(`
[여운 API] 포트 ${env.API_PORT} 을(를) 이미 다른 프로세스가 사용 중입니다 (EADDRINUSE).

  보통은 이전에 띄운 \`apps/api\` dev 서버가 백그라운드에 남아 있을 때입니다.
  루트에서 포트만 비우려면:
    pnpm run free:api4000
  그다음 API를 한 번만 다시 실행하세요:
    pnpm --filter @gamdojang/api dev

  Admin(Vite)는 /api 를 이 포트로 프록시하므로, API가 죽어 있으면 로그인·세션이 실패할 수 있습니다.
`);
    process.exit(1);
  }
  throw e;
}

console.log(`여운 API가 ${env.API_PORT}번 포트에서 실행 중입니다.`);
