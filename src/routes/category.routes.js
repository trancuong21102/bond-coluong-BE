import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createCategorySchema, updateCategorySchema, deleteCategorySchema } from '../validations/category.validation.js';

const router = Router();

// Secure all user category routes with JWT authentication
router.use(authMiddleware);

router.get('/my', asyncHandler(categoryController.getMyCategories));
router.post('/', upload.single('coverImage'), validate(createCategorySchema), asyncHandler(categoryController.createCategory));
router.put('/:id', upload.single('coverImage'), validate(updateCategorySchema), asyncHandler(categoryController.updateCategory));
router.delete('/:id', validate(deleteCategorySchema), asyncHandler(categoryController.deleteCategory));

export default router;
