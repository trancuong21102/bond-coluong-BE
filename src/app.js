import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

// Route Imports
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import categoryRoutes from './routes/category.routes.js';
import accessRoutes from './routes/access.routes.js';
import imageRoutes from './routes/image.routes.js';
import adminRoutes from './routes/admin.routes.js';
import userRoutes from './routes/user.routes.js';
import commentRoutes from './routes/comment.routes.js';

// Middlewares
import errorMiddleware from './middlewares/error.middleware.js';
import { sendError } from './utils/response.js';

const app = express();

// Set up security & parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Expose static files from the uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Mount API Modules
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/categories', accessRoutes); // Mount accessRoutes under categories
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api', commentRoutes); // Các route comments đã có prefix /images/:id/comments hoặc /comments/:id

// Fallback Route Handler
app.use((req, res) => {
  return sendError(res, 'Đường dẫn (Endpoint) không tồn tại trên hệ thống', [], 404);
});

// Attach Global Error Handling
app.use(errorMiddleware);

export default app;
