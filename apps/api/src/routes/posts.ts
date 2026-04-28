import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';
import { getPawLabelFromAverage } from '@gamdojang/domain';

import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { getPostWhereClause } from '../lib/policy.js';
import { containsProfanity } from '../lib/filter.js';
import { resolveMoodTagIds } from '../lib/mood-tag-resolve.js';

const postParamsSchema = z.object({
  postId: z.string().uuid()
});

const reactionBodySchema = z.object({
  score: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  piece_find_pair_session_id: z.string().uuid().optional()
});

const createPostImageSchema = z.object({
  imageUrl: z.string(),
  width: z.number().int(),
  height: z.number().int()
});

const createPostSchema = z.object({
  postType: z.enum(['regular', 'chalna']),
  images: z.array(createPostImageSchema).min(1).max(4),
  caption: z.string().min(1),
  visibility: z.enum(['public', 'followers_only', 'private']),
  moodTagIds: z.array(z.string().min(1).max(80)).min(1),
  expiresInHours: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(6)]).optional()
});

const updatePostSchema = z.object({
  caption: z.string().min(1).optional(),
  visibility: z.enum(['public', 'followers_only', 'private']).optional(),
  moodTagIds: z.array(z.string().min(1).max(80)).min(1).optional()
});

export const postRoutes: FastifyPluginAsync = async (app) => {
  // CREATE
  app.post('/posts', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const payload = createPostSchema.parse(request.body);

    if (containsProfanity(payload.caption)) {
      return reply.status(400).send({ error: '비속어가 포함된 내용은 작성할 수 없습니다.' });
    }

    if (payload.postType === 'regular' && payload.images.length > 4) {
      return reply.status(400).send({ error: 'Regular posts can have up to 4 images' });
    }
    if (payload.postType === 'chalna' && payload.images.length !== 1) {
      return reply.status(400).send({ error: 'Chalna must have exactly 1 image' });
    }
    if (payload.postType === 'chalna' && !payload.expiresInHours) {
      return reply.status(400).send({ error: 'Chalna requires expiresInHours (1, 2, 3, or 6)' });
    }

    const expiresAt =
      payload.postType === 'chalna'
        ? new Date(Date.now() + payload.expiresInHours! * 60 * 60 * 1000)
        : null;

    const post = await prisma.$transaction(async (tx) => {
      const moodTagIds = await resolveMoodTagIds(tx, payload.moodTagIds);
      return tx.post.create({
        data: {
          userId,
          postType: payload.postType,
          caption: payload.caption,
          visibility: payload.visibility,
          expiresAt,
          images: {
            create: payload.images.map((img, idx) => ({
              imageUrl: img.imageUrl,
              width: img.width,
              height: img.height,
              sortOrder: idx
            }))
          },
          moodTags: {
            create: moodTagIds.map((moodTagId) => ({
              moodTagId
            }))
          }
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          moodTags: { include: { moodTag: true } },
          user: { include: { profile: true } }
        }
      });
    });

    return success(post);
  });

  // READ (Supports both regular and chalna)
  app.get('/posts/:postId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const baseWhere = await getPostWhereClause(userId);

    const post = await prisma.post.findFirst({
      where: { ...baseWhere, id: postId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: true } }
      }
    });

    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    if (post.postType === 'chalna' && post.expiresAt && post.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Chalna has expired' });
    }

    return success(post);
  });

  // Backward compatibility mock for the chalna specific endpoint if needed
  app.get('/chalna/:postId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const baseWhere = await getPostWhereClause(userId);

    const post = await prisma.post.findFirst({
      where: { ...baseWhere, id: postId, postType: 'chalna' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: true } }
      }
    });

    if (!post) {
      return reply.status(404).send({ error: 'Chalna not found' });
    }
    if (post.expiresAt && post.expiresAt < new Date()) {
      return reply.status(404).send({ error: 'Chalna has expired' });
    }

    return success(post);
  });

  // UPDATE
  app.patch('/posts/:postId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const payload = updatePostSchema.parse(request.body);

    if (payload.caption && containsProfanity(payload.caption)) {
      return reply.status(400).send({ error: '비속어가 포함된 내용은 작성할 수 없습니다.' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    if (post.userId !== userId) {
      return reply.status(403).send({ error: 'Not authorized to edit this post' });
    }

    const updatedPost = await prisma.$transaction(async (tx) => {
      // If mood tags are updated, we need to delete existing links and create new ones
      if (payload.moodTagIds) {
        const moodTagIds = await resolveMoodTagIds(tx, payload.moodTagIds);
        await tx.postMoodTag.deleteMany({
          where: { postId }
        });
        await tx.postMoodTag.createMany({
          data: moodTagIds.map((moodTagId) => ({
            postId,
            moodTagId
          }))
        });
      }

      return tx.post.update({
        where: { id: postId },
        data: {
          caption: payload.caption !== undefined ? payload.caption : undefined,
          visibility: payload.visibility !== undefined ? payload.visibility : undefined
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          moodTags: { include: { moodTag: true } },
          user: { include: { profile: true } }
        }
      });
    });

    return success(updatedPost);
  });

  // DELETE
  app.delete('/posts/:postId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }
    if (post.userId !== userId) {
      return reply.status(403).send({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    return success({ success: true });
  });

  app.post('/posts/:postId/bookmark', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return success({ bookmarked: false });
    } else {
      await prisma.bookmark.create({
        data: { userId, postId }
      });
      return success({ bookmarked: true });
    }
  });

  // Reactions
  app.post('/posts/:postId/reactions', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const { score, piece_find_pair_session_id } = reactionBodySchema.parse(request.body);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return reply.status(404).send({ error: 'Post not found' });
    }

    if (piece_find_pair_session_id) {
      const session = await prisma.pieceFindPairSession.findFirst({
        where: { id: piece_find_pair_session_id, userId, status: 'open' }
      });
      if (!session) {
        return reply.status(400).send({
          error: '열린 조각 쌍이 아니에요. 룩을 고른 뒤에는 이 쌍으로 여운을 남길 수 없어요.'
        });
      }
      if (postId !== session.postIdA && postId !== session.postIdB) {
        return reply.status(400).send({ error: '이 조각 쌍에 포함된 룩에만 여운을 남길 수 있어요.' });
      }
    }

    const updatedReactionData = await prisma.$transaction(async (tx) => {
      const reactionContext = piece_find_pair_session_id ? ('piece_find' as const) : ('feed' as const);

      const existingReaction = await tx.pawReaction.findUnique({
        where: {
          postId_userId: { postId, userId }
        }
      });

      let diffSum = score;
      let diffCount = 1;

      if (existingReaction) {
        diffSum = score - existingReaction.score;
        diffCount = 0;
        await tx.pawReaction.update({
          where: { id: existingReaction.id },
          data: { score, context: piece_find_pair_session_id ? 'piece_find' : existingReaction.context }
        });
      } else {
        await tx.pawReaction.create({
          data: {
            postId,
            userId,
            score,
            context: reactionContext
          }
        });
      }

      const newSum = post.reactionScoreSum + diffSum;
      const newCount = post.reactionsCount + diffCount;
      const newAvg = newCount > 0 ? Number((newSum / newCount).toFixed(2)) : 0;
      const newTopLabel = getPawLabelFromAverage(newAvg);

      await tx.post.update({
        where: { id: postId },
        data: {
          reactionScoreSum: newSum,
          reactionsCount: newCount,
          reactionScoreAvg: newAvg,
          topReactionLabel: newTopLabel
        }
      });

      if (piece_find_pair_session_id) {
        const session = await tx.pieceFindPairSession.findFirst({
          where: { id: piece_find_pair_session_id, userId, status: 'open' }
        });
        if (session) {
          await tx.pieceFindPairSession.update({
            where: { id: session.id },
            data: { status: 'consumed_react' }
          });
          await tx.pieceFindPostExclusion.createMany({
            data: [
              { userId, postId: session.postIdA, reason: 'pair_cleared' },
              { userId, postId: session.postIdB, reason: 'pair_cleared' }
            ],
            skipDuplicates: true
          });
        }
      }

      const authorStats = await tx.pawReaction.aggregate({
        where: { post: { userId: post.userId } },
        _count: true,
        _avg: { score: true }
      });
      await tx.userProfile.update({
        where: { userId: post.userId },
        data: {
          receivedReactionsCount: authorStats._count,
          averagePawScore: authorStats._avg.score
            ? Number(authorStats._avg.score.toFixed(2))
            : 0
        }
      });

      return {
        average_score: newAvg,
        top_label: newTopLabel,
        reactions_count: newCount
      };
    });

    return success({
      my_reaction: score,
      reaction_summary: updatedReactionData
    });
  });
};
