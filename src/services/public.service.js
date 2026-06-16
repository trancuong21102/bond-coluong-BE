import prisma from '../config/prisma.js';

/**
 * Get all public categories.
 */
export const getPublicCategories = async (currentUserId) => {
  return await prisma.category.findMany({
    where: { status: 'APPROVED' },
    include: {
      accessList: currentUserId ? { where: { userId: currentUserId } } : false,
    },
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

  // Fetch all matching images (only id and uploadedById to classify them)
  const allImages = await prisma.image.findMany({
    where,
    select: {
      id: true,
      uploadedById: true,
    },
  });

  let followedImages = [];
  let otherImages = [];

  if (currentUserId) {
    const follows = await prisma.follows.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = follows.map(f => f.followingId);

    for (const img of allImages) {
      if (followingIds.includes(img.uploadedById)) {
        followedImages.push(img.id);
      } else {
        otherImages.push(img.id);
      }
    }
  } else {
    otherImages = allImages.map(img => img.id);
  }

  // Shuffle both groups using a seed that changes every 30 minutes to ensure stable pagination
  const seed = Math.floor(Date.now() / (1000 * 60 * 30));
  const shuffle = (array, seedVal) => {
    let m = array.length, t, i;
    let rand = () => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return seedVal / 233280;
    };
    while (m) {
      i = Math.floor(rand() * m--);
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
    return array;
  };

  const shuffledFollowed = shuffle(followedImages, seed);
  const shuffledOthers = shuffle(otherImages, seed + 1);

  const combinedIds = [...shuffledFollowed, ...shuffledOthers];
  const totalItems = combinedIds.length;
  const paginatedIds = combinedIds.slice(skip, skip + limit);

  let items = [];
  if (paginatedIds.length > 0) {
    const fetchedItems = await prisma.image.findMany({
      where: {
        id: { in: paginatedIds },
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

    // Map back to preserve the shuffled order
    const itemMap = new Map(fetchedItems.map(item => [item.id, item]));
    items = paginatedIds.map(id => itemMap.get(id)).filter(Boolean);
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
