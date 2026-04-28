import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { canInteractWithUser } from '../lib/policy.js';

const targetUserParamsSchema = z.object({
  targetUserId: z.string().uuid()
});

export const followRoutes: FastifyPluginAsync = async (app) => {
  app.post('/users/:targetUserId/follow', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { targetUserId } = targetUserParamsSchema.parse(request.params);

    if (userId === targetUserId) {
      return reply.status(400).send({ error: 'Cannot follow yourself' });
    }

    const canSee = await canInteractWithUser(userId, targetUserId);
    if (!canSee) {
      return reply.status(403).send({ error: 'User is not available' });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: { followerUserId_followeeUserId: { followerUserId: userId, followeeUserId: targetUserId } }
    });

    if (existingFollow) {
      // Unfollow or Cancel Request
      await prisma.$transaction(async (tx) => {
        await tx.follow.delete({
          where: { id: existingFollow.id }
        });
        
        if (existingFollow.status === 'accepted') {
          await tx.userProfile.update({
            where: { userId },
            data: { followingCount: { decrement: 1 } }
          });
          await tx.userProfile.update({
            where: { userId: targetUserId },
            data: { followersCount: { decrement: 1 } }
          });
        }
      });
      return success({ isFollowing: false, status: 'none' });
    } else {
      // Follow or Request
      const targetProfile = await prisma.userProfile.findUnique({
        where: { userId: targetUserId }
      });
      if (!targetProfile) {
        return reply.status(404).send({ error: 'User profile not found' });
      }

      const newStatus = targetProfile.accountVisibility === 'private' ? 'pending' : 'accepted';

      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            followerUserId: userId,
            followeeUserId: targetUserId,
            status: newStatus
          }
        });

        if (newStatus === 'accepted') {
          await tx.userProfile.update({
            where: { userId },
            data: { followingCount: { increment: 1 } }
          });
          await tx.userProfile.update({
            where: { userId: targetUserId },
            data: { followersCount: { increment: 1 } }
          });
        }
      });

      return success({ isFollowing: newStatus === 'accepted', status: newStatus });
    }
  });
};
