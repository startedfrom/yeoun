import type { FastifyPluginAsync } from 'fastify';
import type { NotificationType } from '@gamdojang/domain';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';

const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

const paramIdSchema = z.object({
  id: z.string().uuid()
});

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/notifications', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const query = paginationSchema.parse(request.query);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    const items = notifications.map(n => ({
      id: n.id,
      type: n.notificationType as NotificationType,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead
    }));

    return success({
      items,
      next_cursor: notifications.length === query.limit ? notifications[notifications.length - 1].id : null,
      unreadCount
    });
  });

  app.patch('/notifications/:id/read', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { id } = paramIdSchema.parse(request.params);

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return success({ success: true });
  });

  app.post('/notifications/read-all', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return success({ success: true });
  });
};
