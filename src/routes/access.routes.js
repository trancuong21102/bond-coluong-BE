import { Router } from 'express';
import * as accessController from '../controllers/access.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// Route gọi từ Email (GET method, không cần auth vì có token bảo mật)
router.get('/approve-access', asyncHandler(accessController.approveAccess));

// Route yêu cầu truy cập (yêu cầu đăng nhập)
router.post('/:id/request-access', authMiddleware, asyncHandler(accessController.requestAccess));

export default router;
