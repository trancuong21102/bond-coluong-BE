import * as adminService from '../services/admin.service.js';
import * as categoryService from '../services/category.service.js';
import * as imageService from '../services/image.service.js';
import { sendSuccess } from '../utils/response.js';

// === User Management ===

/**
 * Get all users list.
 */
export const getUsers = async (req, res) => {
  const users = await adminService.getAllUsers();
  return sendSuccess(res, 'Lấy danh sách người dùng thành công', users);
};

/**
 * Toggle trusted upload privilege for a user.
 */
export const toggleTrustedUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = await adminService.toggleTrustedUser(id);
  const status = user.isTrusted ? 'CẤP PHÉP' : 'THU HỒI';
  return sendSuccess(
    res,
    `Đã ${status} quyền đăng ảnh không cần duyệt cho ${user.name}`,
    user
  );
};

/**
 * Toggle category-trusted privilege for a user.
 */
export const toggleCategoryTrustedUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = await adminService.toggleCategoryTrustedUser(id);
  const status = user.isCategoryTrusted ? 'CẤP PHÉP' : 'THU HỒI';
  return sendSuccess(
    res,
    `Đã ${status} quyền tạo danh mục không cần duyệt cho ${user.name}`,
    user
  );
};

// === Category Management ===

/**
 * Get all categories list.
 */
export const getCategories = async (req, res) => {
  const categories = await adminService.getAllCategories();
  return sendSuccess(res, 'Lấy danh sách danh mục thành công', categories);
};

/**
 * Admin creates a category.
 */
export const createCategory = async (req, res) => {
  const { name, description, isPublic } = req.body;
  const category = await categoryService.createCategory({
    name,
    description,
    isPublic,
    userId: req.user.id,
    file: req.file,
    role: req.user.role,
    isCategoryTrusted: true, // Admin always auto-approved
  });
  return sendSuccess(res, 'Tạo danh mục thành công (Đã được duyệt)', category, 201);
};

/**
 * Admin updates a category.
 */
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.user.id, {
    ...req.body,
    file: req.file,
  }, true);
  return sendSuccess(res, 'Cập nhật danh mục thành công', category);
};

/**
 * Admin deletes a category.
 */
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.deleteCategory(id, req.user.id, true);
  return sendSuccess(res, 'Xóa danh mục thành công', category);
};

/**
 * Admin switches category visibility status.
 */
export const toggleCategoryPublic = async (req, res) => {
  const { id } = req.params;
  const category = await adminService.toggleCategoryPublic(id);
  return sendSuccess(
    res,
    `Đã thay đổi trạng thái danh mục sang ${category.isPublic ? 'CÔNG KHAI' : 'RIÊNG TƯ'}`,
    category
  );
};

/**
 * Admin approves a pending category.
 */
export const approveCategory = async (req, res) => {
  const { id } = req.params;
  const category = await adminService.approveCategory(parseInt(id, 10));
  return sendSuccess(res, 'Duyệt danh mục thành công', category);
};

/**
 * Admin rejects a category with a reason.
 */
export const rejectCategory = async (req, res) => {
  const { id } = req.params;
  const { rejectReason } = req.body;
  const category = await adminService.rejectCategory(parseInt(id, 10), rejectReason);
  return sendSuccess(res, 'Từ chối duyệt danh mục thành công', category);
};

// === Image Management ===

/**
 * Get all images list with admin queries.
 */
export const getImages = async (req, res) => {
  const { status, categoryId, uploadedById, page, limit, search } = req.query;
  const data = await adminService.getAllImages({
    status,
    categoryId,
    uploadedById,
    page,
    limit,
    search,
  });
  return sendSuccess(res, 'Lấy danh sách hình ảnh thành công', data);
};

/**
 * Admin uploads an image. Auto APPROVED.
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
  return sendSuccess(res, 'Đăng hình ảnh thành công (Đã duyệt trực tiếp)', image, 201);
};

/**
 * Admin approves an image.
 */
export const approveImage = async (req, res) => {
  const { id } = req.params;
  const image = await adminService.approveImage(id);
  return sendSuccess(res, 'Duyệt hình ảnh thành công', image);
};

/**
 * Admin rejects an image and registers rejectReason.
 */
export const rejectImage = async (req, res) => {
  const { id } = req.params;
  const { rejectReason } = req.body;
  const image = await adminService.rejectImage(id, rejectReason);
  return sendSuccess(res, 'Từ chối duyệt hình ảnh thành công', image);
};

/**
 * Admin switches image visibility status.
 */
export const toggleImagePublic = async (req, res) => {
  const { id } = req.params;
  const image = await adminService.toggleImagePublic(id);
  return sendSuccess(
    res,
    `Đã thay đổi trạng thái hình ảnh sang ${image.isPublic ? 'CÔNG KHAI' : 'RIÊNG TƯ'}`,
    image
  );
};

/**
 * Admin deletes an image.
 */
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  const image = await imageService.deleteImage(id, req.user.id, true);
  return sendSuccess(res, 'Xóa hình ảnh thành công', image);
};
