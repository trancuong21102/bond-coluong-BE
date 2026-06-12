import { Router } from 'express';
import * as imageController from '../controllers/image.controller.js';
import upload from '../middlewares/upload.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadImageSchema, deleteImageSchema } from '../validations/image.validation.js';

const router = Router();

// Secure all user image routes with JWT authentication
router.use(authMiddleware);

router.get('/my', asyncHandler(imageController.getMyImages));

/**
 * Upload image.
 * CRITICAL: upload.single('image') must execute BEFORE validate(uploadImageSchema)
 * because req.body multipart fields are only populated after multer parses them.
 */
router.post('/', upload.single('image'), validate(uploadImageSchema), asyncHandler(imageController.uploadImage));

router.delete('/:id', validate(deleteImageSchema), asyncHandler(imageController.deleteImage));

export default router;
