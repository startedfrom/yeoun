import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { requireAuthUserExists } from '../lib/auth.js';
import { containsProfanity } from '../lib/filter.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { canInteractWithUser } from '../lib/policy.js';
import { mapPostToCardModel } from './feed.js';
import {
  PIECE_FIND_DAILY_LETTER_MAX,
  PIECE_FIND_SESSION_TTL_MS,
  countPieceFindLettersToday,
  deleteExpiredPieceFindSessions,
  pickNewPieceFindPair,
  postsStillEligibleForPieceFind,
  resolvePieceFindEmptyReason
} from '../lib/piece-find.js';
import { env } from '../env.js';

const pairIdParam = z.object({
  pairId: z.string().uuid()
});

const postInclude = (userId: string) => ({
  user: { include: { profile: { include: { representativeMoodTag: true } } } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  moodTags: { include: { moodTag: true } },
  reactions: { where: { userId } },
  bookmarks: { where: { userId } }
});

export const pieceFindRoutes: FastifyPluginAsync = async (app) => {
  app.get('/piece-find/next', { preHandler: [requireAuthUserExists] }, async (request, reply) => {
    const userId = request.userId;
    await deleteExpiredPieceFindSessions(userId);

    const existing = await prisma.pieceFindPairSession.findFirst({
      where: { userId, status: 'open', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      const ok = await postsStillEligibleForPieceFind(userId, existing.postIdA, existing.postIdB);
      if (ok) {
        const posts = await prisma.post.findMany({
          where: { id: { in: [existing.postIdA, existing.postIdB] } },
          include: postInclude(userId)
        });
        const byId = new Map(posts.map((p) => [p.id, p]));
        const left = byId.get(existing.postIdA);
        const right = byId.get(existing.postIdB);
        if (left && right) {
          return success({
            pair_id: existing.id,
            expires_at: existing.expiresAt.toISOString(),
            left: mapPostToCardModel(left, userId),
            right: mapPostToCardModel(right, userId),
            letter_eligible: true,
            simulated_payments_enabled: env.PIECE_FIND_ALLOW_SIMULATED_PAYMENT
          });
        }
      }
      await prisma.pieceFindPairSession.delete({ where: { id: existing.id } });
    }

    await prisma.pieceFindPairSession.deleteMany({
      where: { userId, status: 'open' }
    });

    const picked = await pickNewPieceFindPair(userId);
    if (!picked) {
      const empty_reason = await resolvePieceFindEmptyReason(userId);
      return success({
        pair_id: null,
        expires_at: null,
        left: null,
        right: null,
        letter_eligible: false,
        simulated_payments_enabled: env.PIECE_FIND_ALLOW_SIMULATED_PAYMENT,
        empty_reason
      });
    }

    const expiresAt = new Date(Date.now() + PIECE_FIND_SESSION_TTL_MS);
    const session = await prisma.pieceFindPairSession.create({
      data: {
        userId,
        postIdA: picked.postIdA,
        postIdB: picked.postIdB,
        status: 'open',
        expiresAt
      }
    });

    const posts = await prisma.post.findMany({
      where: { id: { in: [picked.postIdA, picked.postIdB] } },
      include: postInclude(userId)
    });
    const byId = new Map(posts.map((p) => [p.id, p]));
    const left = byId.get(picked.postIdA)!;
    const right = byId.get(picked.postIdB)!;

    return success({
      pair_id: session.id,
      expires_at: expiresAt.toISOString(),
      left: mapPostToCardModel(left, userId),
      right: mapPostToCardModel(right, userId),
      letter_eligible: true,
      simulated_payments_enabled: env.PIECE_FIND_ALLOW_SIMULATED_PAYMENT
    });
  });

  app.post('/piece-find/pair/:pairId/skip', { preHandler: [requireAuthUserExists] }, async (request, reply) => {
    const userId = request.userId;
    const { pairId } = pairIdParam.parse(request.params);

    const session = await prisma.pieceFindPairSession.findFirst({
      where: { id: pairId, userId, status: 'open' }
    });
    if (!session) {
      return reply.status(404).send({ error: '열린 조각 쌍을 찾을 수 없어요.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pieceFindPairSession.update({
        where: { id: pairId },
        data: { status: 'consumed_skip' }
      });
      await tx.pieceFindPostExclusion.createMany({
        data: [
          { userId, postId: session.postIdA, reason: 'skip' },
          { userId, postId: session.postIdB, reason: 'skip' }
        ],
        skipDuplicates: true
      });
    });

    return success({ ok: true });
  });

  const letterBodySchema = z.object({
    post_id: z.string().uuid(),
    initial_message: z.string().min(1).max(300),
    payment_simulation_ack: z.boolean().optional()
  });

  app.post('/piece-find/pair/:pairId/letter', { preHandler: [requireAuthUserExists] }, async (request, reply) => {
    const userId = request.userId;
    const { pairId } = pairIdParam.parse(request.params);
    const body = letterBodySchema.parse(request.body);

    if (containsProfanity(body.initial_message)) {
      return reply.status(400).send({ error: '비속어가 포함된 편지는 보낼 수 없어요.' });
    }

    if (!env.PIECE_FIND_ALLOW_SIMULATED_PAYMENT || !body.payment_simulation_ack) {
      return reply.status(402).send({
        error: '조각찾기 편지는 유료예요. 결제 연동 전에는 이 환경에서만 시뮬레이션할 수 있어요.',
        code: 'payment_required'
      });
    }

    const session = await prisma.pieceFindPairSession.findFirst({
      where: { id: pairId, userId, status: 'open' }
    });
    if (!session) {
      return reply.status(404).send({ error: '열린 조각 쌍을 찾을 수 없어요. 룩을 고른 뒤에는 편지를 보낼 수 없어요.' });
    }

    if (body.post_id !== session.postIdA && body.post_id !== session.postIdB) {
      return reply.status(400).send({ error: '이 쌍에 속한 룩에만 편지를 보낼 수 있어요.' });
    }

    const lettersToday = await countPieceFindLettersToday(userId);
    if (lettersToday >= PIECE_FIND_DAILY_LETTER_MAX) {
      return reply.status(429).send({ error: '오늘 보낼 수 있는 조각찾기 편지 횟수를 넘었어요.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: body.post_id },
      include: { user: { include: { profile: true } } }
    });
    if (!post || post.userId === userId) {
      return reply.status(400).send({ error: '편지를 보낼 수 없는 룩이에요.' });
    }

    if (!(await canInteractWithUser(userId, post.userId))) {
      return reply.status(403).send({ error: '이 사용자에게는 편지를 보낼 수 없어요.' });
    }

    const targetProfile = post.user.profile;
    if (!targetProfile) {
      return reply.status(404).send({ error: '수신 프로필을 찾을 수 없어요.' });
    }
    if (targetProfile.messagePermission === 'nobody') {
      return reply.status(403).send({ error: '이 사용자는 편지를 받지 않아요.' });
    }

    let requireRequest = false;
    if (targetProfile.messagePermission === 'followers_only') {
      const follow = await prisma.follow.findUnique({
        where: { followerUserId_followeeUserId: { followerUserId: userId, followeeUserId: post.userId } }
      });
      if (follow?.status !== 'accepted') requireRequest = true;
    }
    if (targetProfile.messagePermission === 'following_only') {
      const follow = await prisma.follow.findUnique({
        where: { followerUserId_followeeUserId: { followerUserId: post.userId, followeeUserId: userId } }
      });
      if (follow?.status !== 'accepted') requireRequest = true;
    }

    const result = await prisma.$transaction(async (tx) => {
      let messageRequestId: string | null = null;

      if (requireRequest) {
        const existingReq = await tx.messageRequest.findFirst({
          where: { fromUserId: userId, toUserId: post.userId, status: 'pending' }
        });
        if (existingReq) {
          messageRequestId = existingReq.id;
        } else {
          const req = await tx.messageRequest.create({
            data: {
              fromUserId: userId,
              toUserId: post.userId,
              initialMessage: body.initial_message
            }
          });
          messageRequestId = req.id;
        }
      } else {
        const existingConvs = await tx.conversation.findMany({
          where: {
            AND: [{ members: { some: { userId } } }, { members: { some: { userId: post.userId } } }]
          }
        });
        let convId: string;
        if (existingConvs.length > 0) {
          convId = existingConvs[0].id;
        } else {
          const conv = await tx.conversation.create({
            data: {
              conversationType: 'direct',
              members: { create: [{ userId }, { userId: post.userId }] }
            }
          });
          convId = conv.id;
        }
        await tx.message.create({
          data: {
            conversationId: convId,
            senderUserId: userId,
            messageType: 'text',
            content: body.initial_message
          }
        });
        await tx.conversation.update({
          where: { id: convId },
          data: { lastMessageAt: new Date() }
        });
      }

      await tx.pieceFindPostExclusion.upsert({
        where: { userId_postId: { userId, postId: body.post_id } },
        create: { userId, postId: body.post_id, reason: 'letter_sent' },
        update: { reason: 'letter_sent' }
      });

      const paid = await tx.pieceFindPaidLetter.create({
        data: {
          userId,
          postId: body.post_id,
          pairSessionId: pairId,
          messageRequestId,
          paymentReference: 'simulated'
        }
      });

      return { paidId: paid.id, messageRequestId };
    });

    return success({
      ok: true,
      piece_find_paid_letter_id: result.paidId,
      message_request_id: result.messageRequestId
    });
  });
};
