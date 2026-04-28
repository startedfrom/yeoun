import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { withAccentColor } from '../lib/mood-colors.js';

export const moodTagRoutes: FastifyPluginAsync = async (app) => {
  app.get('/mood-tags', async () => {
    const tags = await prisma.moodTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    return success(tags.map(t => withAccentColor(t)));
  });
};
