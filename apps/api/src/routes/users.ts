import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { mapPostToCardModel, mapPostToChalnaModel } from './feed.js';
import { canInteractWithUser, getPostWhereClause } from '../lib/policy.js';
import { withAccentColor } from '../lib/mood-colors.js';

const updateProfileSchema = z.object({
  nickname: z.string().min(2).max(30).optional(),
  bio: z.string().max(160).optional().nullable(),
  profileImageUrl: z.string().url().optional().nullable(),
  representativeMoodTagId: z.string().uuid().optional().nullable(),
  accountVisibility: z.enum(['public', 'private']).optional(),
  messagePermission: z.enum(['everyone', 'followers_only', 'following_only', 'nobody']).optional(),
  commentPermission: z.string().optional(),
  isSearchable: z.boolean().optional()
});

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.get('/users/me/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    return success({
      id: profile.id,
      nickname: profile.nickname,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      representativeMoodTagId: profile.representativeMoodTagId,
      accountVisibility: profile.accountVisibility,
      messagePermission: profile.messagePermission,
      commentPermission: profile.commentPermission,
      isSearchable: profile.isSearchable
    });
  });

  app.patch('/users/me/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const payload = updateProfileSchema.parse(request.body);

    if (payload.nickname) {
      const existing = await prisma.userProfile.findUnique({
        where: { nickname: payload.nickname }
      });
      if (existing && existing.userId !== userId) {
        return reply.status(409).send({ error: 'Nickname already exists' });
      }
    }

    const updated = await prisma.userProfile.update({
      where: { userId },
      data: payload
    });

    return success({
      id: updated.id,
      nickname: updated.nickname,
      profileImageUrl: updated.profileImageUrl,
      bio: updated.bio,
      representativeMoodTagId: updated.representativeMoodTagId,
      accountVisibility: updated.accountVisibility,
      messagePermission: updated.messagePermission,
      commentPermission: updated.commentPermission,
      isSearchable: updated.isSearchable
    });
  });

  async function getFullProfile(currentUserId: string, targetUserId: string, reply: import('fastify').FastifyReply) {
    if (targetUserId !== currentUserId) {
      const canSee = await canInteractWithUser(currentUserId, targetUserId);
      if (!canSee) {
        return reply.status(403).send({ error: 'This profile is private or unavailable' });
      }
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: targetUserId },
      include: { representativeMoodTag: true }
    });

    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    let isFollowing = false;
    let isBlockedByMe = false;

    if (targetUserId !== currentUserId) {
      const follow = await prisma.follow.findUnique({
        where: { followerUserId_followeeUserId: { followerUserId: currentUserId, followeeUserId: targetUserId } }
      });
      isFollowing = follow?.status === 'accepted';

      const block = await prisma.block.findUnique({
        where: { blockerUserId_blockedUserId: { blockerUserId: currentUserId, blockedUserId: targetUserId } }
      });
      isBlockedByMe = !!block;
    }

    const baseWhere = await getPostWhereClause(currentUserId);

    const posts = await prisma.post.findMany({
      where: { ...baseWhere, userId: targetUserId, status: 'active', postType: 'regular' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: { include: { representativeMoodTag: true } } } },
        reactions: { where: { userId: currentUserId } },
        bookmarks: { where: { userId: currentUserId } }
      }
    });

    const activeChalnas = await prisma.post.findMany({
      where: { ...baseWhere, userId: targetUserId, postType: 'chalna', status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: { include: { representativeMoodTag: true } } } },
        reactions: { where: { userId: currentUserId } }
      }
    });

    const interestTags = await prisma.userInterestMoodTag.findMany({
      where: { userId: targetUserId },
      include: { moodTag: true }
    });

    const representativeMoodTags = interestTags.length > 0
      ? interestTags.map(it => withAccentColor(it.moodTag))
      : (profile.representativeMoodTag ? [withAccentColor(profile.representativeMoodTag)] : []);

    return success({
      user: {
        userId: targetUserId,
        nickname: profile.nickname,
        profileImageUrl: profile.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: profile.representativeMoodTag ? withAccentColor(profile.representativeMoodTag) : undefined
      },
      bio: profile.bio || '',
      averagePawScore: Number(profile.averagePawScore),
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      receivedReactionsCount: profile.receivedReactionsCount,
      representativeMoodTags,
      posts: posts.map(p => mapPostToCardModel(p, currentUserId)),
      currentChalna: activeChalnas.length > 0 ? mapPostToChalnaModel(activeChalnas[0], currentUserId) : undefined,
      isFollowing,
      isBlockedByMe
    });
  }

  app.get('/users/me/profile-summary', { preHandler: [requireAuth] }, async (request, reply) => {
    return getFullProfile(request.userId, request.userId, reply);
  });

  const getProfileParams = z.object({
    userId: z.string().uuid()
  });

  app.get('/users/:userId/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    const currentUserId = request.userId;
    let targetUserId = currentUserId;

    if (request.params && (request.params as { userId: string }).userId !== 'me') {
      const parsed = getProfileParams.parse(request.params);
      targetUserId = parsed.userId;
    }

    return getFullProfile(currentUserId, targetUserId, reply);
  });

  const paginationSchema = z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(20).default(20)
  });

  app.get('/users/me/bookmarks', { preHandler: [requireAuth] }, async (request) => {
    const userId = request.userId;
    const query = paginationSchema.parse(request.query);

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        post: {
          OR: [
            { postType: 'regular' },
            { postType: 'chalna', expiresAt: { gt: new Date() } }
          ]
        }
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      include: {
        post: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            moodTags: { include: { moodTag: true } },
            user: { include: { profile: { include: { representativeMoodTag: true } } } },
            reactions: { where: { userId } },
            bookmarks: { where: { userId } }
          }
        }
      }
    });

    const items = bookmarks.map(b => mapPostToCardModel(b.post, userId));

    return success({
      items,
      next_cursor: bookmarks.length === query.limit ? bookmarks[bookmarks.length - 1].id : null
    });
  });
};
