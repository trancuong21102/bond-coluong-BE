import * as publicService from '../services/public.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Get public category list.
 */
export const getPublicCategories = async (req, res) => {
  const categories = await publicService.getPublicCategories();
  return sendSuccess(res, 'Lấy danh sách danh mục thành công', categories);
};

/**
 * Get public category detail by slug.
 */
export const getPublicCategoryBySlug = async (req, res) => {
  const { slug } = req.params;
  const category = await publicService.getPublicCategoryBySlug(slug);
  return sendSuccess(res, 'Lấy thông tin danh mục thành công', category);
};

/**
 * Get public images under a public category.
 */
export const getPublicCategoryImages = async (req, res) => {
  const { slug } = req.params;
  const images = await publicService.getPublicCategoryImages(slug);
  return sendSuccess(res, 'Lấy danh sách ảnh thuộc danh mục thành công', images);
};

/**
 * Get public images list with search and filters.
 */
export const getPublicImages = async (req, res) => {
  const { categoryId, categorySlug, page, limit, search } = req.query;
  const data = await publicService.getPublicImages({
    categoryId,
    categorySlug,
    page,
    limit,
    search,
  });
  return sendSuccess(res, 'Lấy danh sách ảnh thành công', data);
};

/**
 * Get details of a single public image.
 * Uses parsed id from req.params.id (validated by Zod to be a number).
 */
export const getPublicImageById = async (req, res) => {
  const { id } = req.params; // Has been parsed to number by Zod middleware
  const image = await publicService.getPublicImageById(id);
  return sendSuccess(res, 'Lấy chi tiết hình ảnh thành công', image);
};

/**
 * Get related images for a given public image (same category, excluding itself).
 */
export const getRelatedImages = async (req, res) => {
  const { id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 12;
  const images = await publicService.getRelatedImages(id, limit);
  return sendSuccess(res, 'Lấy hình ảnh liên quan thành công', images);
};
