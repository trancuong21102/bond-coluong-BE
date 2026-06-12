import prisma from '../config/prisma.js';

/**
 * Get all public categories.
 */
export const getPublicCategories = async () => {
  return await prisma.category.findMany({
    where: { isPublic: true, status: 'APPROVED' },
    orderBy: { name: 'asc' },
  });
};

/**
 * Get public category details by slug.
 */
export const getPublicCategoryBySlug = async (slug) => {
  const category = await prisma.category.findFirst({
    where: { slug, isPublic: true, status: 'APPROVED' },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại hoặc không ở chế độ công khai');
    error.statusCode = 404;
    throw error;
  }

  return category;
};

/**
 * Get all approved public images inside a specific public category.
 */
export const getPublicCategoryImages = async (slug) => {
  const category = await prisma.category.findFirst({
    where: { slug, isPublic: true, status: 'APPROVED' },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại hoặc không ở chế độ công khai');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.image.findMany({
    where: {
      categoryId: category.id,
      status: 'APPROVED',
      isPublic: true,
    },
    include: {
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
 * Retrieve public images list with pagination, filtering, and search options.
 * Double checks category.isPublic = true for safety.
 */
export const getPublicImages = async ({ categoryId, categorySlug, page = 1, limit = 10, search, currentUserId }) => {
  const skip = (page - 1) * limit;

  // Enforce visibility filters: images must be approved, public, and belong to public categories
  const where = {
    status: 'APPROVED',
    isPublic: true,
    category: {
      isPublic: true,
      status: 'APPROVED',
    },
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (categorySlug) {
    where.category = {
      slug: categorySlug,
      isPublic: true,
      status: 'APPROVED',
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const totalItems = await prisma.image.count({ where });

  let items = await prisma.image.findMany({
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
          avatar: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  // Nếu có currentUserId, kiểm tra xem user đang follow ai để ưu tiên sắp xếp (in-memory per page)
  // Thực tế ở quy mô lớn cần dùng raw SQL ORDER BY CASE. Ở quy mô nhỏ/page size, ta sort tại memory.
  if (currentUserId) {
    const follows = await prisma.follows.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = follows.map(f => f.followingId);

    if (followingIds.length > 0) {
      items.sort((a, b) => {
        const aFollowed = followingIds.includes(a.uploadedById) ? 1 : 0;
        const bFollowed = followingIds.includes(b.uploadedById) ? 1 : 0;
        if (aFollowed > bFollowed) return -1;
        if (aFollowed < bFollowed) return 1;
        return 0; // Giữ nguyên thứ tự createdAt desc
      });
    }
  }

  return {
    images: items,
    pagination: {
      totalItems,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

/**
 * Get details of a single public image by ID.
 */
export const getPublicImageById = async (id) => {
  const image = await prisma.image.findFirst({
    where: {
      id,
      status: 'APPROVED',
      isPublic: true,
      category: {
        isPublic: true,
        status: 'APPROVED',
      },
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
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại hoặc không ở chế độ công khai');
    error.statusCode = 404;
    throw error;
  }

  return image;
};

/**
 * Get related images for a given image.
 * Returns approved, public images from the same category, excluding the image itself.
 */
export const getRelatedImages = async (id, limit = 12) => {
  // First, find the image to get its categoryId
  const image = await prisma.image.findFirst({
    where: {
      id,
      status: 'APPROVED',
      isPublic: true,
      category: { isPublic: true, status: 'APPROVED' },
    },
    select: { categoryId: true },
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại hoặc không ở chế độ công khai');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.image.findMany({
    where: {
      categoryId: image.categoryId,
      status: 'APPROVED',
      isPublic: true,
      id: { not: id },
      category: { isPublic: true, status: 'APPROVED' },
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
    take: limit,
  });
};
