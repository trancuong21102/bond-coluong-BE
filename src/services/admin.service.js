import prisma from '../config/prisma.js';

/**
 * Get all users registered on the platform.
 */
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isTrusted: true,
      isCategoryTrusted: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Toggle trusted upload privilege for a user.
 * When isTrusted = true, user's uploads are auto-approved without admin review.
 */
export const toggleTrustedUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN') {
    const error = new Error('Không thể thay đổi quyền của tài khoản Admin');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.user.update({
    where: { id },
    data: { isTrusted: !user.isTrusted },
    select: {
      id: true, name: true, email: true, role: true,
      isTrusted: true, isCategoryTrusted: true, avatar: true,
      createdAt: true, updatedAt: true,
    },
  });
};

/**
 * Toggle category-trusted privilege for a user.
 * When isCategoryTrusted = true, user’s categories are auto-approved without admin review.
 */
export const toggleCategoryTrustedUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (user.role === 'ADMIN') {
    const error = new Error('Không thể thay đổi quyền của tài khoản Admin');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.user.update({
    where: { id },
    data: { isCategoryTrusted: !user.isCategoryTrusted },
    select: {
      id: true, name: true, email: true, role: true,
      isTrusted: true, isCategoryTrusted: true, avatar: true,
      createdAt: true, updatedAt: true,
    },
  });
};

/**
 * Get all categories on the platform.
 */
export const getAllCategories = async () => {
  return await prisma.category.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: { images: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Switch public visibility state for a category.
 */
export const toggleCategoryPublic = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.category.update({
    where: { id },
    data: {
      isPublic: !category.isPublic,
    },
  });
};

/**
 * Approve a pending category. Status becomes APPROVED.
 */
export const approveCategory = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.category.update({
    where: { id },
    data: { status: 'APPROVED', rejectReason: null },
  });
};

/**
 * Reject a pending category. Status becomes REJECTED, rejectReason stored.
 */
export const rejectCategory = async (id, rejectReason) => {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.category.update({
    where: { id },
    data: { status: 'REJECTED', rejectReason },
  });
};

/**
 * Get all images on the platform with administrative filters.
 */
export const getAllImages = async ({ status, categoryId, uploadedById, page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;

  // Build admin filters
  const where = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (uploadedById) where.uploadedById = uploadedById;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [totalItems, items] = await Promise.all([
    prisma.image.count({ where }),
    prisma.image.findMany({
      where,
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
            email: true,
            avatar: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    images: items,
    pagination: {
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

/**
 * Approve image. Status becomes APPROVED, rejectReason cleared.
 */
export const approveImage = async (id) => {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.image.update({
    where: { id },
    data: {
      status: 'APPROVED',
      rejectReason: null,
    },
  });
};

/**
 * Reject image. Status becomes REJECTED, rejectReason stored.
 */
export const rejectImage = async (id, rejectReason) => {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.image.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectReason,
    },
  });
};

/**
 * Toggle image public visibility.
 */
export const toggleImagePublic = async (id) => {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.image.update({
    where: { id },
    data: {
      isPublic: !image.isPublic,
    },
  });
};
