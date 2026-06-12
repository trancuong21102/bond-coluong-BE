import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware to authorize requests by validating JWT.
 * Attaches the resolved user object (excluding the password) to req.user.
 */
export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Yêu cầu đăng nhập để truy cập tài nguyên này', [], 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 'Mã xác thực (Token) không hợp lệ', [], 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user to guarantee the profile hasn't been deleted or altered
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isTrusted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return sendError(res, 'Tài khoản người dùng không tồn tại hoặc đã bị xóa', [], 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
