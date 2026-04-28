import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from './prisma.js';
import { getPostWhereClause } from './policy.js';

export const PIECE_FIND_SESSION_TTL_MS = 30 * 60 * 1000;
export const PIECE_FIND_DAILY_LETTER_MAX = 8;
export const PIECE_FIND_CANDIDATE_POOL = 160;

/** 조각찾기 후보 풀 공통: 운영 전역 제외 + 패션 적합 */
export function pieceFindCatalogGate(): Prisma.PostWhereInput {
  return {
    pieceFindGloballyExcluded: false,
    fashionEligible: true
  };
}

export async function getExcludedPostIdsForPieceFind(userId: string): Promise<Set<string>> {
  const [reactions, exclusions, reports] = await Promise.all([
    prisma.pawReaction.findMany({ where: { userId }, select: { postId: true } }),
    prisma.pieceFindPostExclusion.findMany({ where: { userId }, select: { postId: true } }),
    prisma.report.findMany({
      where: { reporterUserId: userId, targetType: 'post' },
      select: { targetId: true }
    })
  ]);
  const set = new Set<string>();
  for (const r of reactions) set.add(r.postId);
  for (const e of exclusions) set.add(e.postId);
  for (const r of reports) set.add(r.targetId);
  return set;
}

export async function deleteExpiredPieceFindSessions(userId: string): Promise<void> {
  await prisma.pieceFindPairSession.deleteMany({
    where: {
      userId,
      status: 'open',
      expiresAt: { lt: new Date() }
    }
  });
}

export async function postsStillEligibleForPieceFind(
  userId: string,
  postIdA: string,
  postIdB: string
): Promise<boolean> {
  const base = await getPostWhereClause(userId);
  const excluded = await getExcludedPostIdsForPieceFind(userId);
  const where: Prisma.PostWhereInput = {
    ...base,
    ...pieceFindCatalogGate(),
    id: { in: [postIdA, postIdB] },
    postType: 'regular',
    status: 'active',
    userId: { not: userId },
    moodTags: { some: {} },
    ...(excluded.size > 0 ? { NOT: { id: { in: [...excluded] } } } : {})
  };
  const n = await prisma.post.count({ where });
  return n === 2;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** `pickNewPieceFindPair`가 null일 때 안내용: DB에 비교 후보가 거의 없음 vs 반응·제외로 소진 */
export async function resolvePieceFindEmptyReason(
  userId: string
): Promise<'insufficient_catalog' | 'pool_exhausted'> {
  const base = await getPostWhereClause(userId);
  const rawCount = await prisma.post.count({
    where: {
      ...base,
      ...pieceFindCatalogGate(),
      postType: 'regular',
      status: 'active',
      userId: { not: userId },
      moodTags: { some: {} }
    }
  });
  return rawCount < 2 ? 'insufficient_catalog' : 'pool_exhausted';
}

export async function pickNewPieceFindPair(userId: string): Promise<{ postIdA: string; postIdB: string } | null> {
  const excluded = await getExcludedPostIdsForPieceFind(userId);
  const notIn = [...excluded];
  const base = await getPostWhereClause(userId);

  const lastSession = await prisma.pieceFindPairSession.findFirst({
    where: { userId, status: { in: ['consumed_skip', 'consumed_react'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      postA: { select: { userId: true } },
      postB: { select: { userId: true } }
    }
  });
  const avoidAuthorIds = new Set<string>();
  if (lastSession) {
    avoidAuthorIds.add(lastSession.postA.userId);
    avoidAuthorIds.add(lastSession.postB.userId);
  }

  const where: Prisma.PostWhereInput = {
    ...base,
    ...pieceFindCatalogGate(),
    postType: 'regular',
    status: 'active',
    userId: { not: userId },
    moodTags: { some: {} },
    ...(notIn.length > 0 ? { id: { notIn } } : {})
  };

  const pool = await prisma.post.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    take: PIECE_FIND_CANDIDATE_POOL,
    select: {
      id: true,
      userId: true
    }
  });

  if (pool.length < 2) return null;

  shuffleInPlace(pool);

  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const p = pool[i];
      const q = pool[j];
      if (p.userId === q.userId) continue;
      if (avoidAuthorIds.size > 0 && avoidAuthorIds.has(p.userId) && avoidAuthorIds.has(q.userId)) {
        continue;
      }
      const aId = p.id < q.id ? p.id : q.id;
      const bId = p.id < q.id ? q.id : p.id;
      return { postIdA: aId, postIdB: bId };
    }
  }

  const first = pool[0];
  const second = pool.find((p) => p.id !== first.id) ?? null;
  if (!second) return null;
  const aId = first.id < second.id ? first.id : second.id;
  const bId = first.id < second.id ? second.id : first.id;
  return { postIdA: aId, postIdB: bId };
}

export async function countPieceFindLettersToday(userId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.pieceFindPaidLetter.count({
    where: { userId, createdAt: { gte: start } }
  });
}
