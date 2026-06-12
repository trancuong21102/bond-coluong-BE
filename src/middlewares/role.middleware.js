import { sendError } from '../utils/response.js';

/**
 * Curried role check middleware.
 * @param {...string} roles Permitted roles (e.g. 'ADMIN', 'USER')
 */
export default function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Không tìm thấy thông tin đăng nhập hợp lệ', [], 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Bạn không có quyền thực hiện chức năng này', [], 403);
    }

    next();
  };
}
