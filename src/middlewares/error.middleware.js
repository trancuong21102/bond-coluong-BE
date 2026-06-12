import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Global Express error handling middleware.
 * Intercepts all standard throws, Zod validation errors, and Prisma Client errors.
 */
export default function errorMiddleware(err, req, res, next) {
  // Log the complete error stack in development or test modes
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error Details]:', err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Handle Zod Schema validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Dữ liệu đầu vào không hợp lệ';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle Prisma Database constraints (e.g. unique constraint failed P2002)
  else if (err.code === 'P2002') {
    statusCode = 400;
    const target = err.meta?.target || '';
    if (target.includes('email')) {
      message = 'Email này đã tồn tại trên hệ thống';
    } else if (target.includes('slug')) {
      message = 'Slug danh mục này đã tồn tại';
    } else {
      message = 'Dữ liệu bị trùng lặp trong hệ thống';
    }
  }

  // Handle Multer upload limits
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File upload vượt quá giới hạn cho phép (Tối đa 5MB)';
  }

  // Handle JWT related validation errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token đã hết hạn';
  }

  return sendError(res, message, errors, statusCode);
}
