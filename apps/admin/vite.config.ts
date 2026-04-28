import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    /** 기본 localhost는 IPv6(::1)만 잡는 경우가 있어 127.0.0.1로 고정(curl·프록시 검증 일치) */
    host: '127.0.0.1',
    port: 5173,
    /** 5173 점유 시 다른 포트로 조용히 넘어가면 프록시·북마크가 어긋나므로 실패를 명시 */
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('error', (err) => {
            console.error('[admin vite proxy /api → 127.0.0.1:4000]', err.message);
          });
        },
      },
    },
  },
});
