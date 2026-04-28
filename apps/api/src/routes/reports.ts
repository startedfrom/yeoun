import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';

const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'message']),
  targetId: z.string().uuid(),
  reasonCode: z.enum([
    'abuse',
    'harassment',
    'sexual',
    'appearance_shaming',
    'spam',
    'impersonation',
    'copyright',
    'underage',
    'other'
  ]),
  detailText: z.string().max(500).optional()
});

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.post('/reports', {
    preHandler: [requireAuth],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour'
      }
    }
  }, async (request, reply) => {
    const userId = request.userId;
    const payload = createReportSchema.parse(request.body);

    if (payload.targetType === 'user' && payload.targetId === userId) {
      return reply.status(400).send({ error: 'You cannot report yourself' });
    }

    const report = await prisma.report.create({
      data: {
        reporterUserId: userId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        reasonCode: payload.reasonCode,
        detailText: payload.detailText
      }
    });

    return success({ id: report.id });
  });
};
