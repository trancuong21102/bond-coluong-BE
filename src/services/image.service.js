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
export const uploadImage = async ({ title, description, isPublic, categoryId, userId, file, role }) => {
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

  // Admin upload defaults to APPROVED directly, USER upload defaults to PENDING
  const status = role === 'ADMIN' ? 'APPROVED' : 'PENDING';

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
