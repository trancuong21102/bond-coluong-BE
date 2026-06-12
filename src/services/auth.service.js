import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { uploadToCloudinary } from '../utils/cloudinaryHelper.js';
import deleteFile from '../utils/deleteFile.js';

/**
 * Register a new user in the database.
 * Default role is always USER.
 */
export const register = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('Email này đã tồn tại trên hệ thống');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Log in an existing user.
 * Generates and returns a signed JWT.
 */
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    const error = new Error('Email hoặc mật khẩu không chính xác');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

/**
 * Update user profile details and avatar.
 */
export const updateProfile = async (userId, { name, email, file }) => {
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    if (file) await deleteFile(file.path);
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const updateData = {};

  if (name) {
    updateData.name = name;
  }

  if (email && email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      if (file) await deleteFile(file.path);
      const error = new Error('Email này đã tồn tại trên hệ thống');
      error.statusCode = 400;
      throw error;
    }
    updateData.email = email;
  }

  if (file) {
    try {
      const cloudinaryResult = await uploadToCloudinary(file.path, 'pinterest_avatars');
      updateData.avatar = cloudinaryResult.secure_url;
    } finally {
      await deleteFile(file.path);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

/**
 * Change user password.
 */
export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('Người dùng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordMatch) {
    const error = new Error('Mật khẩu hiện tại không chính xác');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

