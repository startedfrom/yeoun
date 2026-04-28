import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';
import { success } from '../lib/response.js';
import { Prisma } from '../generated/prisma/index.js';
import { getPostWhereClause, getAccessibleUsersWhereClause } from '../lib/policy.js';
import { withAccentColor } from '../lib/mood-colors.js';

const homeFeedQuerySchema = z.object({
  tab: z.enum(['recommended', 'latest', 'following']).default('recommended'),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(20).default(20)
});

const exploreQuerySchema = z.object({
  sort: z.enum(['popular', 'latest']).default('popular'),
  mood_tag_id: z.string().uuid().optional(),
  /** >0이면 넓게 가져온 뒤 시드 셔플해 30개만 반환(산책 탭 당겨서 새로고침) */
  mix: z.coerce.number().int().optional()
});

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const rnd = mulberry32(seed);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapPostToCardModel = (post: any, currentUserId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myReaction = post.reactions?.find((r: any) => r.userId === currentUserId);
  const remainingMs = post.expiresAt ? new Date(post.expiresAt).getTime() - Date.now() : 0;
  return {
    postId: post.id,
    postType: post.postType,
    author: {
      userId: post.user.id,
      nickname: post.user.profile?.nickname || 'Unknown',
      profileImageUrl: post.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
      representativeMoodTag: post.user.profile?.representativeMoodTag ? withAccentColor(post.user.profile.representativeMoodTag) : undefined
    },
    images: post.images,
    caption: post.caption,
    locationText: post.locationText,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moodTags: post.moodTags?.map((mt: any) => withAccentColor(mt.moodTag)) || [],
    reactionSummary: {
      averageScore: Number(post.reactionScoreAvg),
      topLabel: post.topReactionLabel || '슬쩍',
      reactionsCount: post.reactionsCount,
      myScore: myReaction ? myReaction.score : undefined
    },
    commentsCount: post.commentsCount,
    bookmarked: post.bookmarks?.length > 0,
    createdAt: post.createdAt.toISOString(),
    visibility: post.visibility,
    ...(post.postType === 'chalna'
      ? {
          expiresAt: post.expiresAt?.toISOString(),
          remainingSeconds: remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0
        }
      : {})
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapPostToChalnaModel = (post: any, currentUserId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myReaction = post.reactions?.find((r: any) => r.userId === currentUserId);
  const remainingMs = post.expiresAt ? new Date(post.expiresAt).getTime() - Date.now() : 0;
  return {
    postId: post.id,
    postType: 'chalna' as const,
    author: {
      userId: post.user.id,
      nickname: post.user.profile?.nickname || 'Unknown',
      profileImageUrl: post.user.profile?.profileImageUrl || 'https://via.placeholder.com/150',
      representativeMoodTag: post.user.profile?.representativeMoodTag ? withAccentColor(post.user.profile.representativeMoodTag) : undefined
    },
    thumbnailImageUrl: post.images?.[0]?.imageUrl || '',
    caption: post.caption,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    moodTags: post.moodTags?.map((mt: any) => withAccentColor(mt.moodTag)) || [],
    expiresAt: post.expiresAt?.toISOString(),
    remainingSeconds: remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0,
    hasUnread: false, // Not implemented
    reactionSummary: {
      averageScore: Number(post.reactionScoreAvg),
      topLabel: post.topReactionLabel || '슬쩍',
      reactionsCount: post.reactionsCount,
      myScore: myReaction ? myReaction.score : undefined
    }
  };
}

export const feedRoutes: FastifyPluginAsync = async (app) => {
  app.get('/feed/home', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const query = homeFeedQuerySchema.parse(request.query);

    const baseWhere = await getPostWhereClause(userId);
    /** `baseWhere`에 이미 `OR`(가시성)이 있으므로 spread 후 `OR`를 덮어쓰면 안 됨 */
    const chalnaTimeFilter: Prisma.PostWhereInput = {
      OR: [
        { postType: 'regular' },
        { postType: 'chalna', expiresAt: { gt: new Date() } }
      ]
    };
    const whereClause: Prisma.PostWhereInput = {
      AND: [baseWhere, chalnaTimeFilter]
    };

    if (query.tab === 'following') {
      const following = await prisma.follow.findMany({
        where: { followerUserId: userId, status: 'accepted' },
        select: { followeeUserId: true }
      });
      const followeeIds = following.map((f) => f.followeeUserId);
      
      // If we already have user.id.in, we must intersect them or replace
      // baseWhere already includes followers and self, so we just restrict to followeeIds
      whereClause.userId = { in: followeeIds };
      // Delete user condition if it conflicts, but Prisma merges top level userId and user properly.
    }

    // Determine sort
    let orderBy: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (query.tab === 'recommended') {
      orderBy = [{ reactionScoreAvg: 'desc' }, { createdAt: 'desc' }];
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy,
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: { include: { representativeMoodTag: true } } } },
        reactions: { where: { userId } },
        bookmarks: { where: { userId } }
      }
    });

    const items = posts.map(post => mapPostToCardModel(post, userId));

    // Fetch active chalnas
    const activeChalnas = await prisma.post.findMany({
      where: {
        ...baseWhere,
        postType: 'chalna',
        status: 'active',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: { include: { representativeMoodTag: true } } } },
        reactions: { where: { userId } }
      }
    });

    const chalnaItems = activeChalnas.map(post => mapPostToChalnaModel(post, userId));

    return success({
      tab: query.tab,
      items,
      chalna: chalnaItems,
      next_cursor: posts.length === query.limit ? posts[posts.length - 1].id : null
    });
  });

  app.get('/explore', { preHandler: [requireAuth] }, async (request, _reply) => {
    const userId = request.userId;
    const query = exploreQuerySchema.parse(request.query);

    const popularTags = await prisma.moodTag.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 10
    });

    const accessibleUsersWhere = await getAccessibleUsersWhereClause(userId);

    const recommendedUsers = await prisma.userProfile.findMany({
      where: {
        user: accessibleUsersWhere
      },
      orderBy: { followersCount: 'desc' },
      take: 5,
      include: { representativeMoodTag: true }
    });

    const baseWhere = await getPostWhereClause(userId);

    const whereClause: Prisma.PostWhereInput = {
      AND: [
        baseWhere,
        { status: 'active' },
        {
          OR: [
            { postType: 'regular' },
            { postType: 'chalna', expiresAt: { gt: new Date() } }
          ]
        },
        ...(query.mood_tag_id
          ? [{ moodTags: { some: { moodTagId: query.mood_tag_id } } } satisfies Prisma.PostWhereInput]
          : [])
      ]
    };

    const orderBy: Prisma.PostOrderByWithRelationInput[] = 
      query.sort === 'popular' 
        ? [{ reactionScoreAvg: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const mixSeed = query.mix != null && query.mix > 0 ? query.mix >>> 0 : 0;
    const useMix = mixSeed > 0;
    const poolTake = useMix ? 48 : 30;

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy,
      take: poolTake,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        moodTags: { include: { moodTag: true } },
        user: { include: { profile: { include: { representativeMoodTag: true } } } },
        reactions: { where: { userId } },
        bookmarks: { where: { userId } }
      }
    });

    const ordered = useMix ? seededShuffle(posts, mixSeed).slice(0, 30) : posts;
    const items = ordered.map((post) => mapPostToCardModel(post, userId));

    return success({
      sort: query.sort,
      popular_tags: popularTags.map(t => withAccentColor(t)),
      recommended_users: recommendedUsers.map(p => ({
        userId: p.userId,
        nickname: p.nickname,
        profileImageUrl: p.profileImageUrl || 'https://via.placeholder.com/150',
        representativeMoodTag: p.representativeMoodTag ? withAccentColor(p.representativeMoodTag) : undefined,
        profile: { bio: p.bio || '' }
      })),
      items
    });
  });
};
