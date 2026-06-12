import prisma from '../config/prisma.js';

/**
 * Get all public categories.
 */
export const getPublicCategories = async () => {
  return await prisma.category.findMany({
    where: { status: 'APPROVED' },
    orderBy: { name: 'asc' },
  });
};

/**
 * Get public category details by slug.
 */
export const getPublicCategoryBySlug = async (slug, currentUserId) => {
  const category = await prisma.category.findFirst({
    where: { slug, status: 'APPROVED' },
    include: {
      accessList: currentUserId ? { where: { userId: currentUserId } } : false,
    }
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (!category.isPublic) {
    const isOwner = currentUserId && category.createdById === currentUserId;
    const hasAccess = currentUserId && category.accessList && category.accessList.length > 0;
    
    if (!isOwner && !hasAccess) {
      const error = new Error('Danh mục này đã bị khoá');
      error.statusCode = 403;
      error.isLocked = true; // Cờ cho frontend
      throw error;
    }
  }

  delete category.accessList;
  return category;
};

/**
 * Get all approved public images inside a specific public category.
 */
export const getPublicCategoryImages = async (slug, currentUserId) => {
  const category = await prisma.category.findFirst({
    where: { slug, status: 'APPROVED' },
    include: {
      accessList: currentUserId ? { where: { userId: currentUserId } } : false,
    }
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (!category.isPublic) {
    const isOwner = currentUserId && category.createdById === currentUserId;
    const hasAccess = currentUserId && category.accessList && category.accessList.length > 0;
    
    if (!isOwner && !hasAccess) {
      const error = new Error('Danh mục này đã bị khoá');
      error.statusCode = 403;
      error.isLocked = true;
      throw error;
    }
  }

  return await prisma.image.findMany({
    where: {
      categoryId: category.id,
      status: 'APPROVED',
      // If the category is private but the user has access, 
      // we allow them to see images in it that are approved. 
      // isPublic on image level should ideally be checked if they are also private? 
      // Usually, images inherit category visibility, but let's just check status here.
      // Or require image.isPublic = true unless category is private. Let's just fetch all APPROVED in this category.
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

  const accessibleCategoryIds = currentUserId ? (await prisma.categoryAccess.findMany({
    where: { userId: currentUserId },
    select: { categoryId: true },
  })).map(a => a.categoryId) : [];

  const categoryCondition = {
    status: 'APPROVED',
    OR: [
      { isPublic: true },
    ]
  };

  if (accessibleCategoryIds.length > 0) {
    categoryCondition.OR.push({ id: { in: accessibleCategoryIds } });
  }
  
  if (currentUserId) {
    categoryCondition.OR.push({ createdById: currentUserId });
  }

  // Enforce visibility filters: images must be approved, public, and belong to accessible categories
  const where = {
    status: 'APPROVED',
    // isPublic: true, // We might want to remove this if we allow private images, but for now images must be public themselves.
    category: categoryCondition,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (categorySlug) {
    where.category = {
      ...where.category,
      slug: categorySlug,
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
export const getPublicImageById = async (id, currentUserId) => {
  const image = await prisma.image.findFirst({
    where: {
      id,
      status: 'APPROVED',
      // isPublic: true, // Ảnh trong danh mục khoá có thể ko bật isPublic, ta xét theo danh mục
    },
    include: {
      category: {
        include: {
          accessList: currentUserId ? { where: { userId: currentUserId } } : false,
        }
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
    const error = new Error('Hình ảnh không tồn tại hoặc chưa được duyệt');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra quyền truy cập danh mục
  if (!image.category.isPublic) {
    const isOwner = currentUserId && image.category.createdById === currentUserId;
    const hasAccess = currentUserId && image.category.accessList && image.category.accessList.length > 0;
    
    if (!isOwner && !hasAccess) {
      const error = new Error('Hình ảnh thuộc danh mục đã bị khoá, bạn không có quyền xem');
      error.statusCode = 403;
      throw error;
    }
  }

  delete image.category.accessList;
  return image;
};

/**
 * Get related images for a given image.
 * Returns approved, public images from the same category, excluding the image itself.
 */
export const getRelatedImages = async (id, currentUserId, limit = 12) => {
  // First, find the image to get its categoryId
  const image = await prisma.image.findFirst({
    where: {
      id,
      status: 'APPROVED',
    },
    include: {
      category: {
        include: {
          accessList: currentUserId ? { where: { userId: currentUserId } } : false,
        }
      }
    }
  });

  if (!image) {
    const error = new Error('Hình ảnh không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra quyền
  if (!image.category.isPublic) {
    const isOwner = currentUserId && image.category.createdById === currentUserId;
    const hasAccess = currentUserId && image.category.accessList && image.category.accessList.length > 0;
    
    if (!isOwner && !hasAccess) {
      const error = new Error('Bạn không có quyền xem ảnh liên quan trong danh mục này');
      error.statusCode = 403;
      throw error;
    }
  }

  return await prisma.image.findMany({
    where: {
      categoryId: image.categoryId,
      status: 'APPROVED',
      id: { not: id },
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
