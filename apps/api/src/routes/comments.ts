import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { canCommentOnPost, canInteractWithUser } from '../lib/policy.js';
import { containsProfanity } from '../lib/filter.js';

const postParamsSchema = z.object({
  postId: z.string().uuid()
});

const commentParamsSchema = z.object({
  commentId: z.string().uuid()
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  parentCommentId: z.string().uuid().optional()
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(500)
});

const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).default(20)
});

export const commentRoutes: FastifyPluginAsync = async (app) => {
  // CREATE comment
  app.post('/posts/:postId/comments', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const { content, parentCommentId } = createCommentSchema.parse(request.body);

    if (containsProfanity(content)) {
      return reply.status(400).send({ error: '비속어가 포함된 내용은 작성할 수 없습니다.' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: { include: { profile: true } } }
    });

    if (!post || post.status !== 'active') {
      return reply.status(404).send({ error: 'Post not found or unavailable' });
    }

    const commentPermission = post.user.profile?.commentPermission || 'everyone';
    const canComment = await canCommentOnPost(userId, post.userId, commentPermission);
    
    if (!canComment) {
      return reply.status(403).send({ error: 'You do not have permission to comment on this post' });
    }

    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentCommentId }
      });
      if (!parent || parent.postId !== postId || parent.status !== 'active') {
        return reply.status(400).send({ error: 'Invalid parent comment' });
      }
    }

    const newComment = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId,
          userId,
          content,
          parentCommentId
        },
        include: {
          user: { include: { profile: { include: { representativeMoodTag: true } } } }
        }
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } }
      });

      return comment;
    });

    return success({
      id: newComment.id,
      user: {
        userId: newComment.user.id,
        nickname: newComment.user.profile?.nickname || 'Unknown',
        profileImageUrl: newComment.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: newComment.user.profile?.representativeMoodTag || undefined
      },
      content: newComment.content,
      createdAt: newComment.createdAt.toISOString()
    });
  });

  // READ comments
  app.get('/posts/:postId/comments', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { postId } = postParamsSchema.parse(request.params);
    const query = paginationSchema.parse(request.query);

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'active') {
      return reply.status(404).send({ error: 'Post not found' });
    }

    const canSee = await canInteractWithUser(userId, post.userId);
    if (!canSee) {
      return reply.status(403).send({ error: 'Cannot view comments for this post' });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        status: 'active'
      },
      orderBy: { createdAt: 'asc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      include: {
        user: { include: { profile: { include: { representativeMoodTag: true } } } }
      }
    });

    const items = [];
    for (const c of comments) {
      // Filter out comments by users who blocked me or I blocked them
      if (await canInteractWithUser(userId, c.userId)) {
        items.push({
          id: c.id,
          user: {
            userId: c.user.id,
            nickname: c.user.profile?.nickname || 'Unknown',
            profileImageUrl: c.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
            representativeMoodTag: c.user.profile?.representativeMoodTag || undefined
          },
          content: c.content,
          createdAt: c.createdAt.toISOString()
        });
      }
    }

    return success({
      items,
      next_cursor: comments.length === query.limit ? comments[comments.length - 1].id : null
    });
  });

  // UPDATE comment
  app.patch('/comments/:commentId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { commentId } = commentParamsSchema.parse(request.params);
    const { content } = updateCommentSchema.parse(request.body);

    if (containsProfanity(content)) {
      return reply.status(400).send({ error: '비속어가 포함된 내용은 작성할 수 없습니다.' });
    }

    const existing = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existing || existing.status !== 'active') {
      return reply.status(404).send({ error: 'Comment not found' });
    }

    if (existing.userId !== userId) {
      return reply.status(403).send({ error: 'Not your comment' });
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { include: { profile: { include: { representativeMoodTag: true } } } }
      }
    });

    return success({
      id: updated.id,
      user: {
        userId: updated.user.id,
        nickname: updated.user.profile?.nickname || 'Unknown',
        profileImageUrl: updated.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: updated.user.profile?.representativeMoodTag || undefined
      },
      content: updated.content,
      createdAt: updated.createdAt.toISOString()
    });
  });

  // DELETE comment
  app.delete('/comments/:commentId', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.userId;
    const { commentId } = commentParamsSchema.parse(request.params);

    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true }
    });

    if (!existing || existing.status !== 'active') {
      return reply.status(404).send({ error: 'Comment not found' });
    }

    // Allow post author or comment author to delete
    if (existing.userId !== userId && existing.post.userId !== userId) {
      return reply.status(403).send({ error: 'Cannot delete this comment' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { status: 'deleted', deletedAt: new Date() }
      });

      await tx.post.update({
        where: { id: existing.postId },
        data: { commentsCount: { decrement: 1 } }
      });
    });

    return success({ success: true });
  });
};
