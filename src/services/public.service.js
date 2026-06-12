import prisma from '../config/prisma.js';

/**
 * Get all public categories.
 */
export const getPublicCategories = async () => {
  return await prisma.category.findMany({
    where: { isPublic: true },
    orderBy: { name: 'asc' },
  });
};

/**
 * Get public category details by slug.
 */
export const getPublicCategoryBySlug = async (slug) => {
  const category = await prisma.category.findFirst({
    where: { slug, isPublic: true },
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
    where: { slug, isPublic: true },
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
export const getPublicImages = async ({ categoryId, categorySlug, page = 1, limit = 10, search }) => {
  const skip = (page - 1) * limit;

  // Enforce visibility filters: images must be approved, public, and belong to public categories
  const where = {
    status: 'APPROVED',
    isPublic: true,
    category: {
      isPublic: true,
    },
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (categorySlug) {
    where.category = {
      slug: categorySlug,
      isPublic: true,
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
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
      category: { isPublic: true },
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
      id: { not: id }, // Exclude the current image
      category: { isPublic: true },
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
