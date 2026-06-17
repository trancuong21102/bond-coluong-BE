import { Router } from 'express';
import * as publicController from '../controllers/public.controller.js';
import validate from '../middlewares/validate.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getCategoryBySlugSchema } from '../validations/category.validation.js';
import { publicImagesQuerySchema, deleteImageSchema } from '../validations/image.validation.js';
import optionalAuthMiddleware from '../middlewares/optionalAuth.middleware.js';

const router = Router();

// Category public routes
router.get('/categories', optionalAuthMiddleware, asyncHandler(publicController.getPublicCategories));
router.get('/categories/:slug', optionalAuthMiddleware, validate(getCategoryBySlugSchema), asyncHandler(publicController.getPublicCategoryBySlug));
router.get('/categories/:slug/images', optionalAuthMiddleware, validate(getCategoryBySlugSchema), asyncHandler(publicController.getPublicCategoryImages));

// Image public routes
router.get('/images', optionalAuthMiddleware, validate(publicImagesQuerySchema), asyncHandler(publicController.getPublicImages));
router.get('/images/:id', optionalAuthMiddleware, validate(deleteImageSchema), asyncHandler(publicController.getPublicImageById));
router.get('/images/:id/related', optionalAuthMiddleware, validate(deleteImageSchema), asyncHandler(publicController.getRelatedImages));

// Search suggestions
router.get('/search/suggestions', optionalAuthMiddleware, asyncHandler(publicController.getSearchSuggestions));

export default router;
