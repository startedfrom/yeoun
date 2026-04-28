import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';

const updateDeviceTokenSchema = z.object({
  deviceToken: z.string(),
  platform: z.enum(['ios', 'android'])
});

export const deviceTokenRoutes: FastifyPluginAsync = async (app) => {
  app.post('/users/me/device-tokens', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const payload = updateDeviceTokenSchema.parse(request.body);

    const existing = await prisma.deviceToken.findFirst({
      where: { userId, deviceToken: payload.deviceToken }
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.deviceToken.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
      }
      return success({ success: true });
    }

    await prisma.deviceToken.create({
      data: {
        userId,
        platform: payload.platform,
        deviceToken: payload.deviceToken,
        isActive: true
      }
    });

    return success({ success: true });
  });
};
