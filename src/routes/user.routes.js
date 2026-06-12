import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// Lấy thông tin user
router.get('/:id', asyncHandler(userController.getUserProfile));

// Yêu cầu xác thực cho các route follow
router.use(authMiddleware);

router.post('/:id/follow', asyncHandler(userController.followUser));
router.delete('/:id/follow', asyncHandler(userController.unfollowUser));
router.get('/:id/follow-status', asyncHandler(userController.getFollowStatus));

export default router;
