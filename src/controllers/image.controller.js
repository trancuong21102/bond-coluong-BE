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
    isTrusted: req.user.isTrusted,
  });
  const msg =
    req.user.role === 'ADMIN' || req.user.isTrusted
      ? 'Đăng ảnh thành công (Đã duyệt trực tiếp)'
      : 'Đăng ảnh thành công, đang chờ quản trị viên duyệt';
  return sendSuccess(res, msg, image, 201);
};

/**
 * Handle user deleting their own image.
 */
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  const image = await imageService.deleteImage(id, req.user.id, false);
  return sendSuccess(res, 'Xóa ảnh thành công', image);
};

/**
 * Save an image.
 */
export const saveImage = async (req, res) => {
  const { id } = req.params;
  const result = await imageService.saveImage(id, req.user.id);
  return sendSuccess(res, 'Lưu ảnh thành công', result);
};

/**
 * Unsave an image.
 */
export const unsaveImage = async (req, res) => {
  const { id } = req.params;
  const result = await imageService.unsaveImage(id, req.user.id);
  return sendSuccess(res, 'Bỏ lưu ảnh thành công', result);
};

/**
 * Get current user's saved images.
 */
export const getSavedImages = async (req, res) => {
  const images = await imageService.getSavedImages(req.user.id);
  return sendSuccess(res, 'Lấy danh sách ảnh đã lưu thành công', images);
};

/**
 * Get current user's saved image IDs.
 */
export const getSavedImageIds = async (req, res) => {
  const ids = await imageService.getSavedImageIds(req.user.id);
  return sendSuccess(res, 'Lấy danh sách ID ảnh đã lưu thành công', ids);
};

