import * as accessService from '../services/access.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import prisma from '../config/prisma.js';

export const requestAccess = async (req, res) => {
  const { id: categorySlugOrId } = req.params;
  
  // Resolve slug or ID to ID
  let categoryId = parseInt(categorySlugOrId, 10);
  if (isNaN(categoryId)) {
    const cat = await prisma.category.findUnique({ where: { slug: categorySlugOrId } });
    if (!cat) return sendError(res, 'Danh mục không tồn tại', [], 404);
    categoryId = cat.id;
  }

  await accessService.requestAccess(categoryId, req.user.id);
  
  return sendSuccess(res, 'Đã gửi yêu cầu cấp quyền thành công. Vui lòng chờ người tạo danh mục phê duyệt.', null);
};

export const approveAccess = async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send('<h1>Lỗi</h1><p>Thiếu token xác nhận</p>');
  }

  try {
    await accessService.approveAccess(token);
    // Trả về HTML cho browser vì chủ danh mục click từ email
    return res.status(200).send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; text-align: center;">
        <h1 style="color: #4CAF50;">Phê duyệt thành công!</h1>
        <p>Bạn đã cấp quyền truy cập danh mục cho người dùng.</p>
        <p>Họ đã có thể xem được hình ảnh trong danh mục này.</p>
      </div>
    `);
  } catch (error) {
    return res.status(400).send(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; text-align: center;">
        <h1 style="color: #f44336;">Lỗi phê duyệt</h1>
        <p>${error.message}</p>
      </div>
    `);
  }
};
