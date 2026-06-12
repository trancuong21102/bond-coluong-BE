import prisma from '../config/prisma.js';

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          images: { where: { isPublic: true, status: 'APPROVED' } },
        }
      }
    }
  });

  if (!user) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    const error = new Error('Không thể tự theo dõi chính mình');
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  await prisma.follows.upsert({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    update: {},
    create: {
      followerId,
      followingId,
    },
  });
};

export const unfollowUser = async (followerId, followingId) => {
  try {
    await prisma.follows.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  } catch (error) {
    // If not found, ignore
  }
};

export const getFollowStatus = async (followerId, followingId) => {
  if (followerId === followingId) return false;
  
  const follow = await prisma.follows.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  return !!follow;
};
