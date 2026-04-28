import type { Prisma } from '../generated/prisma/index.js';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { ADMIN_ACTION_ZOD_TUPLE, resolveAdminAction } from '../lib/admin-action-matrix.js';
import {
  isStaffRole,
  permissionsForUserRole,
  requireAdminPermission,
  requireAdminPermissionAny
} from '../lib/admin-permissions.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { allocateUniqueMoodTagSlug, slugifyMoodTagName } from '../lib/mood-tag-slug.js';
import {
  acceptPendingMessageRequestTx,
  rejectPendingMessageRequestTx
} from '../lib/message-request-ops.js';
import { operatorViewsForReports } from '../lib/report-operator-view.js';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(25)
});

const reportsQuery = pageQuery.extend({
  status: z.enum(['submitted', 'reviewing', 'resolved', 'dismissed']).optional()
});

const postsQuery = pageQuery.extend({
  post_id: z.string().uuid().optional(),
  post_type: z.enum(['regular', 'chalna']).optional(),
  status: z.enum(['active', 'hidden', 'deleted', 'expired']).optional(),
  fashion_eligible: z.enum(['true', 'false']).optional(),
  piece_find_excluded: z.enum(['true', 'false']).optional(),
  q: z.string().max(120).optional()
});

const usersQuery = pageQuery.extend({
  user_id: z.string().uuid().optional(),
  status: z.enum(['active', 'suspended', 'deleted']).optional(),
  q: z.string().max(120).optional()
});

const pairsQuery = pageQuery.extend({
  status: z.enum(['open', 'consumed_skip', 'consumed_react']).optional()
});

const messageRequestsQuery = pageQuery.extend({
  request_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional()
});

const auditQuery = pageQuery.extend({
  action_type: z.string().max(50).optional()
});

const adminActionSchema = z.object({
  action_type: z.enum(ADMIN_ACTION_ZOD_TUPLE),
  target_type: z.enum(['post', 'user', 'report', 'message_request']),
  target_id: z.string().uuid(),
  note: z.string().max(500).optional(),
  flags: z
    .object({
      fashion_eligible: z.boolean().optional(),
      piece_find_globally_excluded: z.boolean().optional()
    })
    .optional()
});

const moodTagUpdateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  slug: z.string().min(1).max(60).optional(),
  display_order: z.coerce.number().int().optional(),
  is_active: z.boolean().optional(),
  editorial_slot: z.enum(['today', 'rising', 'minor']).nullable().optional()
});

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: { id: true, role: true }
  });

  if (!user || !isStaffRole(user.role)) {
    return reply.status(403).send({ error: 'Admin privileges required' });
  }
  request.adminPermissions = permissionsForUserRole(user.role);
}

function skipTake(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/me', { preHandler: [requireAdmin] }, async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: { select: { nickname: true } }
      }
    });

    const permissions = user && isStaffRole(user.role) ? [...permissionsForUserRole(user.role)] : [];

    return success({
      id: user?.id,
      email: user?.email,
      nickname: user?.profile?.nickname ?? null,
      role: user?.role,
      status: user?.status,
      permissions
    });
  });

  app.get('/admin/dashboard', { preHandler: [requireAdmin, requireAdminPermission('dashboard:read')] }, async () => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      reports_open,
      reports_submitted,
      posts_24h,
      chalna_active,
      piece_find_open_sessions,
      paid_letters_7d,
      users_active,
      posts_flagged_fashion
    ] = await Promise.all([
      prisma.report.count({ where: { status: { in: ['submitted', 'reviewing'] } } }),
      prisma.report.count({ where: { status: 'submitted' } }),
      prisma.post.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.post.count({
        where: { postType: 'chalna', status: 'active', expiresAt: { gt: now } }
      }),
      prisma.pieceFindPairSession.count({ where: { status: 'open', expiresAt: { gt: now } } }),
      prisma.pieceFindPaidLetter.count({
        where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
      }),
      prisma.user.count({ where: { status: 'active', deletedAt: null } }),
      prisma.post.count({ where: { fashionEligible: false, status: 'active' } })
    ]);

    return success({
      reports_open,
      reports_submitted,
      posts_last_24h: posts_24h,
      chalna_active_now: chalna_active,
      piece_find_open_sessions,
      paid_letters_last_7d: paid_letters_7d,
      users_active,
      posts_fashion_blocked_active: posts_flagged_fashion
    });
  });

  app.get('/admin/reports', { preHandler: [requireAdmin, requireAdminPermission('reports:read')] }, async (request) => {
    const q = reportsQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);

    const where = q.status ? { status: q.status } : {};

    const [total, rows] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          reporter: { include: { profile: { select: { nickname: true } } } }
        }
      })
    ]);

    const views = await operatorViewsForReports(
      rows.map((r) => ({ id: r.id, targetType: r.targetType, targetId: r.targetId }))
    );

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((r) => ({
        id: r.id,
        status: r.status,
        reason_code: r.reasonCode,
        target_type: r.targetType,
        target_id: r.targetId,
        detail_text: r.detailText,
        created_at: r.createdAt.toISOString(),
        reporter: {
          id: r.reporterUserId,
          nickname: r.reporter.profile?.nickname ?? null
        },
        target_operator: views.get(r.id) ?? null
      }))
    });
  });

  app.get('/admin/posts', { preHandler: [requireAdmin, requireAdminPermissionAny('posts:read', 'chalna:read')] }, async (request) => {
    const q = postsQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);

    const where: Prisma.PostWhereInput = {};
    if (q.post_id) where.id = q.post_id;
    if (q.post_type) where.postType = q.post_type;
    if (q.status) where.status = q.status;
    if (q.fashion_eligible === 'true') where.fashionEligible = true;
    if (q.fashion_eligible === 'false') where.fashionEligible = false;
    if (q.piece_find_excluded === 'true') where.pieceFindGloballyExcluded = true;
    if (q.piece_find_excluded === 'false') where.pieceFindGloballyExcluded = false;
    if (q.q) {
      where.caption = { contains: q.q, mode: 'insensitive' };
    }

    const [total, rows] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { include: { profile: { select: { nickname: true } } } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          moodTags: { include: { moodTag: true } }
        }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((p) => ({
        id: p.id,
        post_type: p.postType,
        status: p.status,
        caption: p.caption,
        created_at: p.createdAt.toISOString(),
        expires_at: p.expiresAt?.toISOString() ?? null,
        fashion_eligible: p.fashionEligible,
        piece_find_globally_excluded: p.pieceFindGloballyExcluded,
        author: {
          id: p.userId,
          nickname: p.user.profile?.nickname ?? null
        },
        thumb_url: p.images[0]?.imageUrl ?? null,
        mood_tags: p.moodTags.map((m) => ({ id: m.moodTagId, name: m.moodTag.name }))
      }))
    });
  });

  app.get('/admin/users', { preHandler: [requireAdmin, requireAdminPermission('users:read')] }, async (request) => {
    const q = usersQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);

    const where: Prisma.UserWhereInput = {};
    if (q.user_id) where.id = q.user_id;
    if (q.status) where.status = q.status;
    if (q.q) {
      where.OR = [
        { email: { contains: q.q, mode: 'insensitive' } },
        { profile: { nickname: { contains: q.q, mode: 'insensitive' } } }
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { profile: { select: { nickname: true } } }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status,
        role: u.role,
        created_at: u.createdAt.toISOString(),
        nickname: u.profile?.nickname ?? null
      }))
    });
  });

  app.get('/admin/message-requests', { preHandler: [requireAdmin, requireAdminPermission('letters:read')] }, async (request) => {
    const q = messageRequestsQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);
    const where: Prisma.MessageRequestWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.request_id) where.id = q.request_id;

    const [total, rows] = await Promise.all([
      prisma.messageRequest.count({ where }),
      prisma.messageRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          fromUser: { include: { profile: { select: { nickname: true } } } },
          toUser: { include: { profile: { select: { nickname: true } } } }
        }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((m) => ({
        id: m.id,
        status: m.status,
        initial_message: m.initialMessage,
        created_at: m.createdAt.toISOString(),
        from: { id: m.fromUserId, nickname: m.fromUser.profile?.nickname ?? null },
        to: { id: m.toUserId, nickname: m.toUser.profile?.nickname ?? null }
      }))
    });
  });

  app.get('/admin/piece-find/pairs', { preHandler: [requireAdmin, requireAdminPermission('piece_find:read')] }, async (request) => {
    const q = pairsQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);
    const where = q.status ? { status: q.status } : {};

    const [total, rows] = await Promise.all([
      prisma.pieceFindPairSession.count({ where }),
      prisma.pieceFindPairSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { include: { profile: { select: { nickname: true } } } },
          postA: {
            include: {
              user: { include: { profile: { select: { nickname: true } } } },
              images: { orderBy: { sortOrder: 'asc' }, take: 1 }
            }
          },
          postB: {
            include: {
              user: { include: { profile: { select: { nickname: true } } } },
              images: { orderBy: { sortOrder: 'asc' }, take: 1 }
            }
          }
        }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((s) => ({
        id: s.id,
        status: s.status,
        expires_at: s.expiresAt.toISOString(),
        created_at: s.createdAt.toISOString(),
        viewer: { id: s.userId, nickname: s.user.profile?.nickname ?? null },
        post_a: {
          id: s.postIdA,
          thumb: s.postA.images[0]?.imageUrl ?? null,
          author: s.postA.user.profile?.nickname ?? null
        },
        post_b: {
          id: s.postIdB,
          thumb: s.postB.images[0]?.imageUrl ?? null,
          author: s.postB.user.profile?.nickname ?? null
        }
      }))
    });
  });

  app.get('/admin/piece-find/paid-letters', { preHandler: [requireAdmin, requireAdminPermission('piece_find:read')] }, async (request) => {
    const q = pageQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);

    const [total, rows] = await Promise.all([
      prisma.pieceFindPaidLetter.count(),
      prisma.pieceFindPaidLetter.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { include: { profile: { select: { nickname: true } } } },
          post: {
            include: {
              user: { include: { profile: { select: { nickname: true } } } },
              images: { orderBy: { sortOrder: 'asc' }, take: 1 }
            }
          },
          messageRequest: { select: { id: true, initialMessage: true, status: true } }
        }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((l) => ({
        id: l.id,
        payment_reference: l.paymentReference,
        created_at: l.createdAt.toISOString(),
        pair_session_id: l.pairSessionId,
        sender: { id: l.userId, nickname: l.user.profile?.nickname ?? null },
        target_post: {
          id: l.postId,
          thumb: l.post.images[0]?.imageUrl ?? null,
          author_nickname: l.post.user.profile?.nickname ?? null
        },
        message_request: l.messageRequest
          ? {
              id: l.messageRequest.id,
              status: l.messageRequest.status,
              initial_message: l.messageRequest.initialMessage
            }
          : null
      }))
    });
  });

  app.get('/admin/mood-tags', { preHandler: [requireAdmin, requireAdminPermission('hashtags:read')] }, async () => {
    const tags = await prisma.moodTag.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
    return success({
      items: tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        display_order: t.displayOrder,
        is_active: t.isActive,
        editorial_slot: t.editorialSlot
      }))
    });
  });

  app.put('/admin/mood-tags/:id', { preHandler: [requireAdmin, requireAdminPermission('hashtags:write')] }, async (request, reply) => {
    const id = z.string().uuid().parse((request.params as { id: string }).id);
    const body = moodTagUpdateSchema.parse(request.body);

    const exists = await prisma.moodTag.findUnique({ where: { id } });
    if (!exists) return reply.status(404).send({ error: 'Mood tag not found' });

    if (body.name !== undefined && body.name !== exists.name) {
      const taken = await prisma.moodTag.findFirst({
        where: { name: body.name, NOT: { id } },
        select: { id: true }
      });
      if (taken) return reply.status(409).send({ error: 'Mood tag name already in use' });
    }

    let nextSlug = exists.slug;
    if (body.slug !== undefined) {
      nextSlug = await allocateUniqueMoodTagSlug(body.slug.trim().slice(0, 60), id);
    } else if (body.name !== undefined && body.name !== exists.name) {
      nextSlug = await allocateUniqueMoodTagSlug(slugifyMoodTagName(body.name), id);
    }

    const updated = await prisma.moodTag.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.slug !== undefined || (body.name !== undefined && body.name !== exists.name)
          ? { slug: nextSlug }
          : {}),
        ...(body.display_order !== undefined ? { displayOrder: body.display_order } : {}),
        ...(body.is_active !== undefined ? { isActive: body.is_active } : {}),
        ...(body.editorial_slot !== undefined ? { editorialSlot: body.editorial_slot } : {})
      }
    });

    await prisma.adminActionLog.create({
      data: {
        adminUserId: request.userId,
        actionType: 'update_mood_tag',
        targetType: 'mood_tag',
        targetId: id,
        note: JSON.stringify(body)
      }
    });

    return success({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      display_order: updated.displayOrder,
      is_active: updated.isActive,
      editorial_slot: updated.editorialSlot
    });
  });

  app.get('/admin/payment-orders', { preHandler: [requireAdmin, requireAdminPermission('payments:read')] }, async (request) => {
    const q = pageQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);

    const [total, rows] = await Promise.all([
      prisma.paymentOrder.count(),
      prisma.paymentOrder.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { include: { profile: { select: { nickname: true } } } },
          refunds: { select: { id: true, status: true } }
        }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((o) => ({
        id: o.id,
        user_id: o.userId,
        provider: o.provider,
        status: o.status,
        amount_minor: o.amountMinor,
        currency: o.currency,
        external_ref: o.externalRef,
        note: o.note,
        created_at: o.createdAt.toISOString(),
        payer_nickname: o.user.profile?.nickname ?? null,
        refunds: o.refunds.map((r) => ({ id: r.id, status: r.status }))
      }))
    });
  });

  app.get('/admin/audit-logs', { preHandler: [requireAdmin, requireAdminPermission('audit:read')] }, async (request) => {
    const q = auditQuery.parse(request.query);
    const { skip, take } = skipTake(q.page, q.page_size);
    const where = q.action_type ? { actionType: q.action_type } : {};

    const [total, rows] = await Promise.all([
      prisma.adminActionLog.count({ where }),
      prisma.adminActionLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { adminUser: { include: { profile: { select: { nickname: true } } } } }
      })
    ]);

    return success({
      total,
      page: q.page,
      page_size: q.page_size,
      items: rows.map((l) => ({
        id: l.id,
        action_type: l.actionType,
        target_type: l.targetType,
        target_id: l.targetId,
        note: l.note,
        created_at: l.createdAt.toISOString(),
        admin: {
          id: l.adminUserId,
          nickname: l.adminUser.profile?.nickname ?? null
        }
      }))
    });
  });

  app.post('/admin/actions', { preHandler: [requireAdmin] }, async (request, reply) => {
    const adminId = request.userId;
    const payload = adminActionSchema.parse(request.body);

    if (payload.action_type === 'set_post_flags') {
      if (payload.target_type !== 'post') {
        return reply.status(400).send({ error: 'set_post_flags requires target_type post' });
      }
      if (!payload.flags || Object.keys(payload.flags).length === 0) {
        return reply.status(400).send({ error: 'flags required' });
      }
    }

    const resolved = resolveAdminAction(payload.action_type, payload.target_type);
    if (!resolved) {
      return reply.status(400).send({ error: 'Invalid action_type and target_type combination' });
    }

    for (const p of resolved.permissions) {
      if (!request.adminPermissions?.includes(p)) {
        return reply.status(403).send({ error: 'Forbidden', missing_permission: p });
      }
    }

    try {
      const actionLog = await prisma.$transaction(async (tx) => {
        const { action_type, target_type, target_id, note, flags } = payload;

        if (action_type === 'hide_post' && target_type === 'post') {
          await tx.post.update({ where: { id: target_id }, data: { status: 'hidden' } });
        } else if (action_type === 'restore_post' && target_type === 'post') {
          await tx.post.update({ where: { id: target_id }, data: { status: 'active' } });
        } else if (action_type === 'suspend_user' && target_type === 'user') {
          await tx.user.update({ where: { id: target_id }, data: { status: 'suspended' } });
        } else if (action_type === 'unsuspend_user' && target_type === 'user') {
          await tx.user.update({ where: { id: target_id }, data: { status: 'active' } });
        } else if (action_type === 'dismiss_report' && target_type === 'report') {
          await tx.report.update({ where: { id: target_id }, data: { status: 'dismissed' } });
        } else if (action_type === 'resolve_report' && target_type === 'report') {
          await tx.report.update({ where: { id: target_id }, data: { status: 'resolved' } });
        } else if (action_type === 'start_report_review' && target_type === 'report') {
          await tx.report.update({ where: { id: target_id }, data: { status: 'reviewing' } });
        } else if (action_type === 'set_post_flags' && target_type === 'post') {
          await tx.post.update({
            where: { id: target_id },
            data: {
              ...(flags?.fashion_eligible !== undefined ? { fashionEligible: flags.fashion_eligible } : {}),
              ...(flags?.piece_find_globally_excluded !== undefined
                ? { pieceFindGloballyExcluded: flags.piece_find_globally_excluded }
                : {})
            }
          });
        } else if (action_type === 'hide_report_target_post' && target_type === 'report') {
          const rep = await tx.report.findUnique({ where: { id: target_id } });
          if (!rep || rep.targetType !== 'post') throw new Error('report_target_not_post');
          await tx.post.update({ where: { id: rep.targetId }, data: { status: 'hidden' } });
          await tx.report.update({ where: { id: target_id }, data: { status: 'resolved' } });
        } else if (action_type === 'suspend_report_target_user' && target_type === 'report') {
          const rep = await tx.report.findUnique({ where: { id: target_id } });
          if (!rep || rep.targetType !== 'user') throw new Error('report_target_not_user');
          await tx.user.update({ where: { id: rep.targetId }, data: { status: 'suspended' } });
          await tx.report.update({ where: { id: target_id }, data: { status: 'resolved' } });
        } else if (action_type === 'accept_message_request' && target_type === 'message_request') {
          await acceptPendingMessageRequestTx(tx, target_id);
        } else if (action_type === 'reject_message_request' && target_type === 'message_request') {
          await rejectPendingMessageRequestTx(tx, target_id);
        } else {
          throw new Error('Invalid action combination');
        }

        return tx.adminActionLog.create({
          data: {
            adminUserId: adminId,
            actionType: action_type,
            targetType: target_type,
            targetId: target_id,
            note: note ?? (flags ? JSON.stringify(flags) : null)
          }
        });
      });

      return success({ id: actionLog.id });
    } catch {
      return reply.status(400).send({ error: 'Action failed' });
    }
  });
};
