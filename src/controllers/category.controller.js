import * as categoryService from '../services/category.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Retrieve current user's category list.
 */
export const getMyCategories = async (req, res) => {
  const categories = await categoryService.getMyCategories(req.user.id);
  return sendSuccess(res, 'Lấy danh sách danh mục thành công', categories);
};

/**
 * Create a category for the current user.
 */
export const createCategory = async (req, res) => {
  const { name, description, isPublic } = req.body;
  const category = await categoryService.createCategory({
    name,
    description,
    isPublic,
    userId: req.user.id,
    file: req.file,
  });
  return sendSuccess(res, 'Tạo danh mục thành công', category, 201);
};

/**
 * Update current user's category.
 */
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.user.id, {
    ...req.body,
    file: req.file,
  }, false);
  return sendSuccess(res, 'Cập nhật danh mục thành công', category);
};

/**
 * Delete current user's category.
 */
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.deleteCategory(id, req.user.id, false);
  return sendSuccess(res, 'Xóa danh mục thành công', category);
};
