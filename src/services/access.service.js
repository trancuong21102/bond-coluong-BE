import prisma from '../config/prisma.js';
import crypto from 'crypto';
import { sendAccessRequestEmail } from './email.service.js';

export const requestAccess = async (categoryId, requesterId) => {
  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { createdBy: true },
  });

  if (!category) {
    const error = new Error('Danh mục không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  if (category.isPublic) {
    const error = new Error('Danh mục này đã công khai, không cần xin quyền');
    error.statusCode = 400;
    throw error;
  }

  // Check if user already has access
  const existingAccess = await prisma.categoryAccess.findUnique({
    where: {
      categoryId_userId: { categoryId, userId: requesterId },
    },
  });

  if (existingAccess) {
    const error = new Error('Bạn đã được cấp quyền truy cập danh mục này rồi');
    error.statusCode = 400;
    throw error;
  }

  // Check if a pending request already exists
  const existingRequest = await prisma.accessRequest.findFirst({
    where: {
      categoryId,
      requesterId,
      status: 'PENDING',
    },
    include: {
      requester: { select: { name: true, email: true } },
    },
  });

  if (existingRequest) {
    // Đã xin quyền rồi, cho phép gửi lại email
    const backendUrl = process.env.API_URL || 'http://localhost:8386';
    const approvalLink = `${backendUrl}/api/categories/approve-access?token=${existingRequest.token}`;

    await sendAccessRequestEmail({
      toEmail: category.createdBy.email,
      requesterName: existingRequest.requester.name,
      categoryName: category.name,
      approvalLink,
    });

    return existingRequest;
  }

  // Create token
  const token = crypto.randomBytes(32).toString('hex');

  const request = await prisma.accessRequest.create({
    data: {
      categoryId,
      requesterId,
      token,
      status: 'PENDING',
    },
    include: {
      requester: { select: { name: true, email: true } },
    },
  });

  // Construct approval link. Using frontend or backend URL.
  // Ideally, it goes to backend which redirects to a frontend success page.
  const backendUrl = process.env.API_URL || 'http://localhost:8386';
  const approvalLink = `${backendUrl}/api/categories/approve-access?token=${token}`;

  // Send email to the category owner
  await sendAccessRequestEmail({
    toEmail: category.createdBy.email,
    requesterName: request.requester.name,
    categoryName: category.name,
    approvalLink,
  });

  return request;
};

export const approveAccess = async (token) => {
  const request = await prisma.accessRequest.findUnique({
    where: { token },
  });

  if (!request) {
    const error = new Error('Token không hợp lệ hoặc đã hết hạn');
    error.statusCode = 400;
    throw error;
  }

  if (request.status !== 'PENDING') {
    const error = new Error('Yêu cầu này đã được xử lý');
    error.statusCode = 400;
    throw error;
  }

  // Update status and create CategoryAccess
  await prisma.$transaction([
    prisma.accessRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED' },
    }),
    prisma.categoryAccess.upsert({
      where: {
        categoryId_userId: {
          categoryId: request.categoryId,
          userId: request.requesterId,
        },
      },
      update: {},
      create: {
        categoryId: request.categoryId,
        userId: request.requesterId,
      },
    }),
  ]);

  return { success: true };
};
