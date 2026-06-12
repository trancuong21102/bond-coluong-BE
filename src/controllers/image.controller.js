import * as imageService from '../services/image.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Get current user's uploaded images.
 */
export const getMyImages = async (req, res) => {
  const images = await imageService.getMyImages(req.user.id);
  return sendSuccess(res, 'Lấy danh sách ảnh thành công', images);
};

/**
 * Handle user uploading an image.
 */
export const uploadImage = async (req, res) => {
  const { title, description, isPublic, categoryId } = req.body;
  const image = await imageService.uploadImage({
    title,
    description,
    isPublic,
    categoryId,
    userId: req.user.id,
    file: req.file,
    role: req.user.role,
  });
  return sendSuccess(res, 'Đăng ảnh thành công, đang chờ quản trị viên duyệt', image, 201);
};

/**
 * Handle user deleting their own image.
 */
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  const image = await imageService.deleteImage(id, req.user.id, false);
  return sendSuccess(res, 'Xóa ảnh thành công', image);
};
