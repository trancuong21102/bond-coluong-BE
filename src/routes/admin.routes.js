import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import requireRole from '../middlewares/role.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';

import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '../validations/category.validation.js';

import {
  adminImagesQuerySchema,
  uploadImageSchema,
  approveImageSchema,
  rejectImageSchema,
  togglePublicSchema,
  deleteImageSchema,
} from '../validations/image.validation.js';

const router = Router();

// Apply auth protection and role-based validation to all routes inside /api/admin/*
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// User Management
router.get('/users', asyncHandler(adminController.getUsers));
router.patch('/users/:id/toggle-trusted', asyncHandler(adminController.toggleTrustedUser));
router.patch('/users/:id/toggle-category-trusted', asyncHandler(adminController.toggleCategoryTrustedUser));

// Category Management
router.get('/categories', asyncHandler(adminController.getCategories));
router.post('/categories', upload.single('coverImage'), validate(createCategorySchema), asyncHandler(adminController.createCategory));
router.put('/categories/:id', upload.single('coverImage'), validate(updateCategorySchema), asyncHandler(adminController.updateCategory));
router.delete('/categories/:id', validate(deleteCategorySchema), asyncHandler(adminController.deleteCategory));
router.patch('/categories/:id/approve', validate(deleteCategorySchema), asyncHandler(adminController.approveCategory));
router.patch('/categories/:id/reject', validate(deleteCategorySchema), asyncHandler(adminController.rejectCategory));
router.patch('/categories/:id/toggle-public', validate(deleteCategorySchema), asyncHandler(adminController.toggleCategoryPublic));

// Image Management
router.get('/images', validate(adminImagesQuerySchema), asyncHandler(adminController.getImages));

/**
 * Admin direct image upload. Auto-approved.
 * Multer execution precedes validation parsing.
 */
router.post('/images', upload.single('image'), validate(uploadImageSchema), asyncHandler(adminController.uploadImage));

router.patch('/images/:id/approve', validate(approveImageSchema), asyncHandler(adminController.approveImage));
router.patch('/images/:id/reject', validate(rejectImageSchema), asyncHandler(adminController.rejectImage));
router.patch('/images/:id/toggle-public', validate(togglePublicSchema), asyncHandler(adminController.toggleImagePublic));
router.delete('/images/:id', validate(deleteImageSchema), asyncHandler(adminController.deleteImage));

export default router;
