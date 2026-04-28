import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { getAccessibleUsersWhereClause, getPostWhereClause } from '../lib/policy.js';
import { withAccentColor } from '../lib/mood-colors.js';
import type { Prisma } from '../generated/prisma/index.js';
import { mapPostToCardModel } from './feed.js';

const searchQuerySchema = z.object({
  q: z.string(),
  type: z.enum(['all', 'users', 'posts', 'tags']).default('all')
});

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get('/search', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const query = searchQuerySchema.parse(request.query);
    const keyword = query.q.trim();
    if (!keyword.length) {
      return reply.status(400).send({ success: false, error: '검색어가 비어 있어요.' });
    }

    const wantUsers = query.type === 'all' || query.type === 'users';
    const wantTags = query.type === 'all' || query.type === 'tags';
    const wantPosts = query.type === 'all' || query.type === 'posts';

    const accessibleUsersWhere = await getAccessibleUsersWhereClause(userId);
    const basePostWhere = await getPostWhereClause(userId);

    const postKeywordWhere: Prisma.PostWhereInput = {
      AND: [
        basePostWhere,
        {
          OR: [
            { postType: 'regular' },
            { postType: 'chalna', expiresAt: { gt: new Date() } }
          ]
        },
        {
          OR: [
            { caption: { contains: keyword, mode: 'insensitive' } },
            { locationText: { contains: keyword, mode: 'insensitive' } }
          ]
        }
      ]
    };

    const postInclude = {
      images: { orderBy: { sortOrder: 'asc' as const } },
      moodTags: { include: { moodTag: true } },
      user: { include: { profile: { include: { representativeMoodTag: true } } } },
      reactions: { where: { userId } },
      bookmarks: { where: { userId } }
    } as const;

    const [users, tags, posts] = await Promise.all([
      wantUsers
        ? prisma.userProfile.findMany({
            where: {
              user: accessibleUsersWhere,
              OR: [
                { nickname: { contains: keyword, mode: 'insensitive' } },
                { bio: { contains: keyword, mode: 'insensitive' } }
              ]
            },
            take: 10,
            include: { representativeMoodTag: true }
          })
        : [],
      wantTags
        ? prisma.moodTag.findMany({
            where: {
              name: { contains: keyword, mode: 'insensitive' },
              isActive: true
            },
            take: 10
          })
        : [],
      wantPosts
        ? prisma.post.findMany({
            where: postKeywordWhere,
            orderBy: [{ reactionScoreAvg: 'desc' }, { createdAt: 'desc' }],
            take: 20,
            include: postInclude
          })
        : []
    ]);

    return success({
      users: users.map((u) => ({
        userId: u.userId,
        nickname: u.nickname,
        profileImageUrl: u.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: u.representativeMoodTag ? withAccentColor(u.representativeMoodTag) : undefined
      })),
      tags: tags.map((t) => withAccentColor(t)),
      posts: posts.map((p) => mapPostToCardModel(p, userId))
    });
  });
};
