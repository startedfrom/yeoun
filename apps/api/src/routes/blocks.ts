import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';

const targetUserParamsSchema = z.object({
  targetUserId: z.string().uuid()
});

export const blockRoutes: FastifyPluginAsync = async (app) => {
  app.post('/users/:targetUserId/block', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { targetUserId } = targetUserParamsSchema.parse(request.params);

    if (userId === targetUserId) {
      return reply.status(400).send({ error: 'Cannot block yourself' });
    }

    const existingBlock = await prisma.block.findUnique({
      where: { blockerUserId_blockedUserId: { blockerUserId: userId, blockedUserId: targetUserId } }
    });

    if (existingBlock) {
      // Unblock
      await prisma.block.delete({
        where: { id: existingBlock.id }
      });
      return success({ isBlocked: false });
    } else {
      // Block
      await prisma.$transaction(async (tx) => {
        await tx.block.create({
          data: {
            blockerUserId: userId,
            blockedUserId: targetUserId
          }
        });

        // Also remove follows in both directions
        const follows = await tx.follow.findMany({
          where: {
            OR: [
              { followerUserId: userId, followeeUserId: targetUserId },
              { followerUserId: targetUserId, followeeUserId: userId }
            ]
          }
        });

        for (const f of follows) {
          await tx.follow.delete({ where: { id: f.id } });
          if (f.status === 'accepted') {
            await tx.userProfile.update({
              where: { userId: f.followerUserId },
              data: { followingCount: { decrement: 1 } }
            });
            await tx.userProfile.update({
              where: { userId: f.followeeUserId },
              data: { followersCount: { decrement: 1 } }
            });
          }
        }
      });
      
      return success({ isBlocked: true });
    }
  });
};
