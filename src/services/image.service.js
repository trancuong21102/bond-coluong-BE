import prisma from '../config/prisma.js';
import deleteFile from '../utils/deleteFile.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';

/**
 * Get all images uploaded by a specific user.
 */
export const getMyImages = async (userId) => {
  return await prisma.image.findMany({
    where: { uploadedById: userId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Handle uploading files.
 * Verifies category exists, flags status according to role, and cleans file if verify fails.
 */
export const uploadImage = async ({ title, description, isPublic, categoryId, userId, file, role, isTrusted }) => {
  if (!file) {
    const error = new Error('Vui lòng chọn ảnh để tải lên');
    error.statusCode = 400;
    throw error;
  }

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    // Crucial: Delete physical file if DB mapping fails so we don't leave orphaned files on disk
    await deleteFile(file.path);
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  let imageUrl = '';
  try {
    // Upload local file to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file.path, 'pinterest_images');
    imageUrl = cloudinaryResult.secure_url;
  } finally {
    // Physically delete the local temporary file from the server
    await deleteFile(file.path);
  }

  // Admin → APPROVED; Trusted user → APPROVED; Regular user → PENDING
  const status = role === 'ADMIN' || isTrusted ? 'APPROVED' : 'PENDING';

  return await prisma.image.create({
    data: {
      title,
      description,
      imageUrl,
      categoryId,
      uploadedById: userId,
      status,
      isPublic,
    },
  });
};

/**
 * Delete image file and DB record.
 * Validates ownership unless isAdmin flag is set.
 */
export const deleteImage = async (id, userId, isAdmin = false) => {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Authorize: must be owner or admin
  if (!isAdmin && image.uploadedById !== userId) {
    const error = new Error('Bạn không có quyền xóa hình ảnh này');
    error.statusCode = 403;
    throw error;
  }

  // Physically delete the local upload image file
  if (image.imageUrl) {
    await deleteFile(image.imageUrl);
  }

  // Delete from DB
  await prisma.image.delete({
    where: { id },
  });

  return image;
};

export const saveImage = async (imageId, userId) => {
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      status: 'APPROVED',
    },
    include: {
      category: {
        include: {
          accessList: { where: { userId } }
        }
      }
    }
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại hoặc chưa được duyệt');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra quyền nếu danh mục khoá
  if (!image.category.isPublic) {
    const isOwner = image.category.createdById === userId;
    const hasAccess = image.category.accessList && image.category.accessList.length > 0;
    if (!isOwner && !hasAccess) {
      const error = new Error('Bạn không có quyền lưu hình ảnh trong danh mục này');
      error.statusCode = 403;
      throw error;
    }
  }

  // Update user to connect this image
  return await prisma.user.update({
    where: { id: userId },
    data: {
      savedImages: {
        connect: { id: imageId },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
};

/**
 * Unsave/remove bookmark of an image for a user.
 */
export const unsaveImage = async (imageId, userId) => {
  // Update user to disconnect this image
  return await prisma.user.update({
    where: { id: userId },
    data: {
      savedImages: {
        disconnect: { id: imageId },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
};

export const getSavedImages = async (userId) => {
  const accessibleCategoryIds = (await prisma.categoryAccess.findMany({
    where: { userId },
    select: { categoryId: true },
  })).map(a => a.categoryId);

  const categoryCondition = {
    status: 'APPROVED',
    OR: [
      { isPublic: true },
      { id: { in: accessibleCategoryIds } },
      { createdById: userId }
    ]
  };

  return await prisma.image.findMany({
    where: {
      savedBy: {
        some: { id: userId },
      },
      status: 'APPROVED',
      category: categoryCondition,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      uploadedBy: {
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

/**
 * Get simple list of IDs of images saved by a specific user.
 */
export const getSavedImageIds = async (userId) => {
  const accessibleCategoryIds = (await prisma.categoryAccess.findMany({
    where: { userId },
    select: { categoryId: true },
  })).map(a => a.categoryId);

  const categoryCondition = {
    status: 'APPROVED',
    OR: [
      { isPublic: true },
      { id: { in: accessibleCategoryIds } },
      { createdById: userId }
    ]
  };

  const images = await prisma.image.findMany({
    where: {
      savedBy: {
        some: { id: userId },
      },
      status: 'APPROVED',
      category: categoryCondition,
    },
    select: {
      id: true,
    },
  });
  return images.map((img) => img.id);
};

