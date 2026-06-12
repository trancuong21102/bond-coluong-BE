import prisma from '../config/prisma.js';

export const getComments = async (imageId) => {
  return await prisma.comment.findMany({
    where: { imageId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const createComment = async ({ userId, imageId, content }) => {
  // Kiểm tra ảnh tồn tại và công khai (hoặc cho phép comment)
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.comment.create({
    data: {
      content,
      userId,
      imageId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
};

export const deleteComment = async (id, userId, isAdmin = false) => {
  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) {
    const error = new Error('Bình luận không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (!isAdmin && comment.userId !== userId) {
    const error = new Error('Bạn không có quyền xóa bình luận này');
    error.statusCode = 403;
    throw error;
  }

  return await prisma.comment.delete({
    where: { id },
  });
};
