import { prisma } from './prisma.js';

export type ReportListRow = {
  id: string;
  targetType: string;
  targetId: string;
};

export type TargetOperatorView = {
  headline: string;
  sub: string | null;
  thumb_url: string | null;
  links: {
    posts?: string;
    users?: string;
    letters?: string;
  };
};

export async function operatorViewsForReports(rows: ReportListRow[]): Promise<Map<string, TargetOperatorView>> {
  const out = new Map<string, TargetOperatorView>();

  const postIds = [...new Set(rows.filter((r) => r.targetType === 'post').map((r) => r.targetId))];
  const userIds = [...new Set(rows.filter((r) => r.targetType === 'user').map((r) => r.targetId))];
  const messageIds = [...new Set(rows.filter((r) => r.targetType === 'message').map((r) => r.targetId))];

  const [posts, users, messages] = await Promise.all([
    postIds.length
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            caption: true,
            user: { select: { profile: { select: { nickname: true } } } },
            images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { imageUrl: true } }
          }
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, profile: { select: { nickname: true } } }
        })
      : [],
    messageIds.length
      ? prisma.message.findMany({
          where: { id: { in: messageIds } },
          select: {
            id: true,
            content: true,
            sender: { select: { profile: { select: { nickname: true } } } }
          }
        })
      : []
  ]);

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const messageMap = new Map(messages.map((m) => [m.id, m]));

  for (const r of rows) {
    if (r.targetType === 'post') {
      const p = postMap.get(r.targetId);
      const cap = p?.caption?.slice(0, 80) ?? '(캡션 없음)';
      out.set(r.id, {
        headline: `게시물 · ${p?.user.profile?.nickname ?? '작성자 미상'}`,
        sub: cap,
        thumb_url: p?.images[0]?.imageUrl ?? null,
        links: { posts: `/posts?post_id=${r.targetId}` }
      });
      continue;
    }
    if (r.targetType === 'user') {
      const u = userMap.get(r.targetId);
      out.set(r.id, {
        headline: `사용자 · ${u?.profile?.nickname ?? u?.email ?? r.targetId.slice(0, 8)}`,
        sub: u?.email ?? null,
        thumb_url: null,
        links: { users: `/users?user_id=${r.targetId}` }
      });
      continue;
    }
    if (r.targetType === 'message') {
      const m = messageMap.get(r.targetId);
      const snippet = m?.content?.slice(0, 120) ?? '(내용 없음)';
      out.set(r.id, {
        headline: `메시지 · ${m?.sender.profile?.nickname ?? '발신자 미상'}`,
        sub: snippet,
        thumb_url: null,
        // MessageRequest 와 Message 는 스키마상 직접 FK 가 없어 request_id 딥링크는 생략. 편지 요청 목록으로 이동.
        links: { letters: '/letters' }
      });
      continue;
    }
    out.set(r.id, {
      headline: `${r.targetType}`,
      sub: r.targetId,
      thumb_url: null,
      links: {}
    });
  }

  return out;
}
