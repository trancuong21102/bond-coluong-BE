import prisma from '../config/prisma.js';
import slugify from '../utils/slugify.js';
import deleteFile from '../utils/deleteFile.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';

/**
 * Get all categories created by a specific user.
 */
export const getMyCategories = async (userId) => {
  return await prisma.category.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Create a new category and automatically generate its unique slug.
 */
export const createCategory = async ({ name, description, isPublic, userId, file, role, isCategoryTrusted }) => {
  let slug = slugify(name);

  // Resolve slug collision
  const existingCategory = await prisma.category.findUnique({
    where: { slug },
  });

  if (existingCategory) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  let coverImage = null;
  if (file) {
    try {
      const cloudinaryResult = await uploadToCloudinary(file.path, 'category_covers');
      coverImage = cloudinaryResult.secure_url;
    } finally {
      await deleteFile(file.path);
    }
  }

  // Admin → APPROVED; Category-trusted user → APPROVED; Regular user → PENDING
  const status = role === 'ADMIN' || isCategoryTrusted ? 'APPROVED' : 'PENDING';

  return await prisma.category.create({
    data: {
      name,
      slug,
      description,
      isPublic,
      coverImage,
      status,
      createdById: userId,
    },
  });
};

/**
 * Update a category (checks owner unless isAdmin is true).
 */
export const updateCategory = async (id, userId, data, isAdmin = false) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Authorize: must be owner or admin
  if (!isAdmin && category.createdById !== userId) {
    const error = new Error('Bạn không có quyền chỉnh sửa danh mục này');
    error.statusCode = 403;
    throw error;
  }

  const { file, ...fieldsToUpdate } = data;
  const updateData = { ...fieldsToUpdate };

  // Re-generate slug if name changed
  if (fieldsToUpdate.name) {
    let slug = slugify(fieldsToUpdate.name);
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    updateData.slug = slug;
  }

  // Handle uploading new cover image
  if (file) {
    let newCoverImage = null;
    try {
      const cloudinaryResult = await uploadToCloudinary(file.path, 'category_covers');
      newCoverImage = cloudinaryResult.secure_url;
    } finally {
      await deleteFile(file.path);
    }

    // Delete the old cover image if it exists
    if (category.coverImage) {
      await deleteFile(category.coverImage);
    }

    updateData.coverImage = newCoverImage;
  }

  return await prisma.category.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a category (checks owner unless isAdmin is true).
 * Safely deletes all physical image files associated with the category.
 */
export const deleteCategory = async (id, userId, isAdmin = false) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Authorize: must be owner or admin
  if (!isAdmin && category.createdById !== userId) {
    const error = new Error('Bạn không có quyền xóa danh mục này');
    error.statusCode = 403;
    throw error;
  }

  // Safety first: Clean up all upload images physically from the storage disk/Cloudinary
  if (category.images && category.images.length > 0) {
    for (const img of category.images) {
      if (img.imageUrl) {
        await deleteFile(img.imageUrl);
      }
    }
  }

  // Also clean up category cover image
  if (category.coverImage) {
    await deleteFile(category.coverImage);
  }

  // Prisma delete (onDelete: Cascade in schema clears children from DB)
  await prisma.category.delete({
    where: { id },
  });

  return category;
};
