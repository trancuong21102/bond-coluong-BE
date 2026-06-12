import { Router } from 'express';
import * as commentController from '../controllers/comment.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// Routes cho image comments (yêu cầu auth hoặc không tùy chọn)
// Lấy danh sách comment không yêu cầu auth
router.get('/images/:imageId/comments', asyncHandler(commentController.getComments));

// Tạo và xóa comment yêu cầu auth
router.use(authMiddleware);
router.post('/images/:imageId/comments', asyncHandler(commentController.createComment));
router.delete('/comments/:id', asyncHandler(commentController.deleteComment));

export default router;
