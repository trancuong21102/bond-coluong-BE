import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import asyncHandler from '../utils/asyncHandler.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authMiddleware, asyncHandler(authController.me));

export default router;
