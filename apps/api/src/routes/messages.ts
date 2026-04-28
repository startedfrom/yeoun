import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { canInteractWithUser } from '../lib/policy.js';
import { containsProfanity } from '../lib/filter.js';
import {
  acceptPendingMessageRequestTx,
  rejectPendingMessageRequestTx
} from '../lib/message-request-ops.js';

const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

const paramIdSchema = z.object({
  id: z.string().uuid()
});

const targetUserParamsSchema = z.object({
  targetUserId: z.string().uuid()
});

const createMessageSchema = z.object({
  content: z.string().optional(),
  sharedPostId: z.string().uuid().optional(),
  messageType: z.enum(['text', 'image', 'post_share']).default('text')
});

const createMessageRequestSchema = z.object({
  initialMessage: z.string().max(300).optional()
});

export const messageRoutes: FastifyPluginAsync = async (app) => {
  // 1. GET /conversations - 대화방 목록
  app.get('/conversations', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const query = paginationSchema.parse(request.query);

    const members = await prisma.conversationMember.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: { user: { include: { profile: { include: { representativeMoodTag: true } } } } }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0
    });

    const items = [];
    for (const m of members) {
      const conv = m.conversation;
      const partnerMember = conv.members[0];
      if (!partnerMember) continue;

      // 차단된 유저와의 대화방 제외
      if (!(await canInteractWithUser(userId, partnerMember.userId))) continue;

      const lastMessage = conv.messages[0];
      if (!lastMessage) continue;

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderUserId: { not: userId },
          createdAt: { gt: m.lastReadMessageId ? undefined : new Date(0) } // Simplified logic
        }
      });

      items.push({
        id: conv.id,
        partner: {
          userId: partnerMember.user.id,
          nickname: partnerMember.user.profile?.nickname || 'Unknown',
          profileImageUrl: partnerMember.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
          representativeMoodTag: partnerMember.user.profile?.representativeMoodTag || undefined
        },
        preview: lastMessage.messageType === 'text' ? lastMessage.content || '' : `[${lastMessage.messageType}]`,
        updatedAt: conv.lastMessageAt?.toISOString() || conv.createdAt.toISOString(),
        unreadCount
      });
    }

    return success({
      items,
      next_cursor: members.length === query.limit ? members[members.length - 1].id : null
    });
  });

  // 2. GET /conversations/:id/messages - 대화방 내 메시지 조회
  app.get('/conversations/:id/messages', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { id } = paramIdSchema.parse(request.params);
    const query = paginationSchema.parse(request.query);

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: { user: { include: { profile: { include: { representativeMoodTag: true } } } } }
            }
          }
        }
      }
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of this conversation' });
    }

    const partner = membership.conversation.members[0];
    if (partner && !(await canInteractWithUser(userId, partner.userId))) {
      return reply.status(403).send({ error: 'Cannot access this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      include: {
        sender: { include: { profile: { include: { representativeMoodTag: true } } } },
        sharedPost: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            moodTags: { include: { moodTag: true } },
            user: { include: { profile: { include: { representativeMoodTag: true } } } },
            reactions: { where: { userId } }
          }
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapPost = (p: any) => {
      if (!p) return undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const myReaction = p.reactions?.find((r: any) => r.userId === userId);
      return {
        postId: p.id,
        postType: p.postType,
        author: {
          userId: p.user.id,
          nickname: p.user.profile?.nickname || 'Unknown',
          profileImageUrl: p.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
          representativeMoodTag: p.user.profile?.representativeMoodTag || undefined
        },
        images: p.images,
        caption: p.caption,
        locationText: p.locationText,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        moodTags: p.moodTags?.map((mt: any) => mt.moodTag) || [],
        reactionSummary: {
          averageScore: Number(p.reactionScoreAvg),
          topLabel: p.topReactionLabel || '슬쩍',
          reactionsCount: p.reactionsCount,
          myScore: myReaction ? myReaction.score : undefined
        },
        commentsCount: p.commentsCount,
        bookmarked: false,
        createdAt: p.createdAt.toISOString(),
        visibility: p.visibility
      };
    };

    const items = messages.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      sender: {
        userId: m.sender.id,
        nickname: m.sender.profile?.nickname || 'Unknown',
        profileImageUrl: m.sender.profile?.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: m.sender.profile?.representativeMoodTag || undefined
      },
      messageType: m.messageType as 'text' | 'image' | 'post_share',
      content: m.content || undefined,
      sharedPost: mapPost(m.sharedPost),
      createdAt: m.createdAt.toISOString()
    }));

    if (messages.length > 0) {
      await prisma.conversationMember.update({
        where: { id: membership.id },
        data: { lastReadMessageId: messages[0].id }
      });
    }

    return success({
      items,
      next_cursor: messages.length === query.limit ? messages[messages.length - 1].id : null
    });
  });

  // 3. POST /conversations/:id/messages - 메시지 전송
  app.post('/conversations/:id/messages', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { id } = paramIdSchema.parse(request.params);
    const payload = createMessageSchema.parse(request.body);

    if (payload.messageType === 'text' && payload.content && containsProfanity(payload.content)) {
      return reply.status(400).send({ error: '비속어가 포함된 메시지는 전송할 수 없습니다.' });
    }

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
      include: { conversation: { include: { members: true } } }
    });

    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of this conversation' });
    }

    const partner = membership.conversation.members.find(m => m.userId !== userId);
    if (partner && !(await canInteractWithUser(userId, partner.userId))) {
      return reply.status(403).send({ error: 'Cannot send message to this user' });
    }

    if (payload.messageType === 'post_share' && !payload.sharedPostId) {
      return reply.status(400).send({ error: 'sharedPostId is required for post_share' });
    }

    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId: id,
          senderUserId: userId,
          messageType: payload.messageType as 'text' | 'image' | 'post_share',
          content: payload.content,
          sharedPostId: payload.sharedPostId
        },
        include: {
          sender: { include: { profile: { include: { representativeMoodTag: true } } } }
        }
      });

      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() }
      });

      // Notification
      if (partner) {
        await tx.notification.create({
          data: {
            userId: partner.userId,
            notificationType: 'message_received',
            actorUserId: userId,
            conversationId: id,
            title: '새 메시지',
            body: payload.messageType === 'text' ? payload.content?.substring(0, 50) || '새 메시지' : '새 메시지'
          }
        });
      }

      return msg;
    });

    return success({
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      sender: {
        userId: newMessage.sender.id,
        nickname: newMessage.sender.profile?.nickname || 'Unknown',
        profileImageUrl: newMessage.sender.profile?.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: newMessage.sender.profile?.representativeMoodTag || undefined
      },
      messageType: newMessage.messageType,
      content: newMessage.content || undefined,
      createdAt: newMessage.createdAt.toISOString()
    });
  });

  // 4. GET /message-requests
  app.get('/message-requests', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const query = paginationSchema.parse(request.query);

    const requests = await prisma.messageRequest.findMany({
      where: { toUserId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      include: {
        fromUser: { include: { profile: { include: { representativeMoodTag: true } } } }
      }
    });

    const items = [];
    for (const r of requests) {
      if (await canInteractWithUser(userId, r.fromUserId)) {
        items.push({
          id: r.id,
          fromUser: {
            userId: r.fromUser.id,
            nickname: r.fromUser.profile?.nickname || 'Unknown',
            profileImageUrl: r.fromUser.profile?.profileImageUrl || 'https://via.placeholder.com/150',
            representativeMoodTag: r.fromUser.profile?.representativeMoodTag || undefined
          },
          initialMessage: r.initialMessage || undefined,
          status: r.status,
          createdAt: r.createdAt.toISOString()
        });
      }
    }

    return success({
      items,
      next_cursor: requests.length === query.limit ? requests[requests.length - 1].id : null
    });
  });

  // 5. POST /users/:targetUserId/message-requests (새 메시지 요청, 혹은 바로 방 생성)
  app.post('/users/:targetUserId/message-requests', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { targetUserId } = targetUserParamsSchema.parse(request.params);
    const payload = createMessageRequestSchema.parse(request.body);

    if (payload.initialMessage && containsProfanity(payload.initialMessage)) {
      return reply.status(400).send({ error: '비속어가 포함된 메시지는 전송할 수 없습니다.' });
    }

    if (userId === targetUserId) return reply.status(400).send({ error: 'Cannot send to yourself' });
    if (!(await canInteractWithUser(userId, targetUserId))) return reply.status(403).send({ error: 'Cannot interact with this user' });

    const targetProfile = await prisma.userProfile.findUnique({ where: { userId: targetUserId } });
    if (!targetProfile) return reply.status(404).send({ error: 'User not found' });

    let requireRequest = false;
    if (targetProfile.messagePermission === 'nobody') return reply.status(403).send({ error: 'This user does not accept messages' });
    if (targetProfile.messagePermission === 'followers_only') {
      const follow = await prisma.follow.findUnique({ where: { followerUserId_followeeUserId: { followerUserId: userId, followeeUserId: targetUserId } } });
      if (follow?.status !== 'accepted') requireRequest = true;
    }
    if (targetProfile.messagePermission === 'following_only') {
      const follow = await prisma.follow.findUnique({ where: { followerUserId_followeeUserId: { followerUserId: targetUserId, followeeUserId: userId } } });
      if (follow?.status !== 'accepted') requireRequest = true;
    }

    // Check existing conversation
    const existingConvs = await prisma.conversation.findMany({
      where: {
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } }
        ]
      }
    });

    if (existingConvs.length > 0) {
      return success({ conversationId: existingConvs[0].id });
    }

    if (requireRequest) {
      // Create request
      const existingReq = await prisma.messageRequest.findFirst({
        where: { fromUserId: userId, toUserId: targetUserId, status: 'pending' }
      });
      if (existingReq) return success({ messageRequestId: existingReq.id });

      const req = await prisma.messageRequest.create({
        data: {
          fromUserId: userId,
          toUserId: targetUserId,
          initialMessage: payload.initialMessage
        }
      });
      return success({ messageRequestId: req.id });
    } else {
      // Create conversation directly
      const conv = await prisma.conversation.create({
        data: {
          conversationType: 'direct',
          members: {
            create: [{ userId }, { userId: targetUserId }]
          }
        }
      });
      return success({ conversationId: conv.id });
    }
  });

  // 6. POST /message-requests/:id/accept
  app.post('/message-requests/:id/accept', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { id } = paramIdSchema.parse(request.params);

    const req = await prisma.messageRequest.findUnique({ where: { id } });
    if (!req || req.toUserId !== userId || req.status !== 'pending') {
      return reply.status(404).send({ error: 'Request not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return acceptPendingMessageRequestTx(tx, id);
    });

    return success({ conversationId: result.conversationId });
  });

  // 7. POST /message-requests/:id/reject
  app.post('/message-requests/:id/reject', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { id } = paramIdSchema.parse(request.params);

    const req = await prisma.messageRequest.findUnique({ where: { id } });
    if (!req || req.toUserId !== userId || req.status !== 'pending') {
      return reply.status(404).send({ error: 'Request not found' });
    }

    await prisma.$transaction(async (tx) => {
      await rejectPendingMessageRequestTx(tx, id);
    });

    return success({ success: true });
  });
};
