import { chalnaFeed, homeFeed } from '@gamdojang/domain';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import fastifyRateLimit from '@fastify/rate-limit';

import { env } from './env.js';
import { authRoutes } from './routes/auth.js';
import { feedRoutes } from './routes/feed.js';
import { moodTagRoutes } from './routes/mood-tags.js';
import { postRoutes } from './routes/posts.js';
import { userRoutes } from './routes/users.js';
import { searchRoutes } from './routes/search.js';
import { commentRoutes } from './routes/comments.js';
import { followRoutes } from './routes/follows.js';
import { blockRoutes } from './routes/blocks.js';
import { messageRoutes } from './routes/messages.js';
import { notificationRoutes } from './routes/notifications.js';
import { deviceTokenRoutes } from './routes/device-tokens.js';
import { reportRoutes } from './routes/reports.js';
import { adminRoutes } from './routes/admin.js';
import { adminIpAllowlistGuard } from './lib/admin-ip-guard.js';
import { pieceFindRoutes } from './routes/piece-find.js';

export async function buildApp() {
  const app = Fastify({
    logger: false,
    trustProxy: env.TRUST_PROXY === '1'
  });

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

  function isAllowedCorsOrigin(origin: string): boolean {
    if (allowedOrigins.includes(origin)) return true;
    try {
      const u = new URL(origin);
      if (u.protocol === 'https:' && u.hostname.endsWith('.vercel.app')) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (isAllowedCorsOrigin(origin)) return cb(null, true);
      return cb(null, false);
    }
  });

  await app.register(fastifyRateLimit, {
    max: 100, // MVP default: 100 requests
    timeWindow: '1 minute'
  });

  app.get('/health', async () => ({
    success: true,
    data: {
      name: '여운 API',
      posts: homeFeed.length,
      chalna: chalnaFeed.length
    }
  }));

  await app.register(async (api) => {
    await api.register(authRoutes, { prefix: env.API_PREFIX });
    await api.register(moodTagRoutes, { prefix: env.API_PREFIX });
    await api.register(feedRoutes, { prefix: env.API_PREFIX });
    await api.register(postRoutes, { prefix: env.API_PREFIX });
    await api.register(userRoutes, { prefix: env.API_PREFIX });
    await api.register(searchRoutes, { prefix: env.API_PREFIX });
    await api.register(commentRoutes, { prefix: env.API_PREFIX });
    await api.register(followRoutes, { prefix: env.API_PREFIX });
    await api.register(blockRoutes, { prefix: env.API_PREFIX });
    await api.register(messageRoutes, { prefix: env.API_PREFIX });
    await api.register(notificationRoutes, { prefix: env.API_PREFIX });
    await api.register(deviceTokenRoutes, { prefix: env.API_PREFIX });
    await api.register(reportRoutes, { prefix: env.API_PREFIX });
    await api.register(
      async (adminScope) => {
        await adminScope.register(fastifyRateLimit, {
          max: env.ADMIN_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
          nameSpace: 'admin-api'
        });
        adminScope.addHook('onRequest', adminIpAllowlistGuard);
        await adminScope.register(adminRoutes);
      },
      { prefix: env.API_PREFIX }
    );
  });

  // 조각찾기는 루트 앱에 직접 붙인다(중첩 register 컨텍스트에서 일부 환경에서 라우트가 안 잡히는 404 방지).
  await app.register(pieceFindRoutes, { prefix: env.API_PREFIX });

  return app;
}
