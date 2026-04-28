import type { Prisma } from '../generated/prisma/index.js';
import { prisma } from './prisma.js';

export async function getBlockUserIds(userId: string): Promise<string[]> {
  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockerUserId: userId },
        { blockedUserId: userId }
      ]
    },
    select: { blockerUserId: true, blockedUserId: true }
  });
  
  const blockIds = new Set<string>();
  for (const b of blocks) {
    if (b.blockerUserId !== userId) blockIds.add(b.blockerUserId);
    if (b.blockedUserId !== userId) blockIds.add(b.blockedUserId);
  }
  return Array.from(blockIds);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const following = await prisma.follow.findMany({
    where: { followerUserId: userId, status: 'accepted' },
    select: { followeeUserId: true }
  });
  return following.map(f => f.followeeUserId);
}

export async function getAccessibleUsersWhereClause(userId: string): Promise<Prisma.UserWhereInput> {
  const blockIds = await getBlockUserIds(userId);
  const followeeIds = await getFollowingIds(userId);
  followeeIds.push(userId); // I can access my own profile

  return {
    id: { notIn: blockIds },
    OR: [
      { profile: { accountVisibility: 'public' } },
      { id: { in: followeeIds } }
    ]
  };
}

export async function getPostWhereClause(userId: string): Promise<Prisma.PostWhereInput> {
  const blockIds = await getBlockUserIds(userId);
  const followeeIds = await getFollowingIds(userId);
  
  const allAllowedUsers = [...followeeIds, userId];

  return {
    status: 'active',
    user: {
      id: { notIn: blockIds },
      OR: [
        { profile: { accountVisibility: 'public' } },
        { id: { in: allAllowedUsers } }
      ]
    },
    OR: [
      { visibility: 'public' },
      { 
        visibility: 'followers_only', 
        userId: { in: allAllowedUsers }
      },
      {
        visibility: 'private',
        userId: userId
      }
    ]
  };
}

export async function canInteractWithUser(currentUserId: string, targetUserId: string): Promise<boolean> {
  if (currentUserId === targetUserId) return true;
  
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerUserId: currentUserId, blockedUserId: targetUserId },
        { blockerUserId: targetUserId, blockedUserId: currentUserId }
      ]
    }
  });
  if (block) return false;

  const targetProfile = await prisma.userProfile.findUnique({
    where: { userId: targetUserId }
  });
  
  if (targetProfile?.accountVisibility === 'private') {
    const isFollowing = await prisma.follow.findUnique({
      where: { followerUserId_followeeUserId: { followerUserId: currentUserId, followeeUserId: targetUserId } }
    });
    if (!isFollowing || isFollowing.status !== 'accepted') return false;
  }
  
  return true;
}

export async function canCommentOnPost(currentUserId: string, postAuthorId: string, commentPermission: string): Promise<boolean> {
  if (currentUserId === postAuthorId) return true;
  if (!(await canInteractWithUser(currentUserId, postAuthorId))) return false;

  if (commentPermission === 'nobody') return false;
  if (commentPermission === 'everyone') return true;

  if (commentPermission === 'followers_only') {
    const isFollowing = await prisma.follow.findUnique({
      where: { followerUserId_followeeUserId: { followerUserId: currentUserId, followeeUserId: postAuthorId } }
    });
    return isFollowing?.status === 'accepted';
  }

  if (commentPermission === 'following_only') {
    const isFollowedBy = await prisma.follow.findUnique({
      where: { followerUserId_followeeUserId: { followerUserId: postAuthorId, followeeUserId: currentUserId } }
    });
    return isFollowedBy?.status === 'accepted';
  }

  return true;
}

