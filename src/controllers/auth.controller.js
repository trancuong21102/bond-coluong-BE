import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Handle user registration request.
 */
export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.register({ name, email, password });
  return sendSuccess(res, 'Đăng ký tài khoản thành công', user, 201);
};

/**
 * Handle user login request.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({ email, password });
  return sendSuccess(res, 'Đăng nhập thành công', data);
};

/**
 * Handle fetch current authenticated user profile request.
 */
export const me = async (req, res) => {
  return sendSuccess(res, 'Lấy thông tin tài khoản thành công', req.user);
};

/**
 * Handle user profile update.
 */
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const user = await authService.updateProfile(req.user.id, {
    name,
    email,
    file: req.file,
  });
  return sendSuccess(res, 'Cập nhật hồ sơ thành công', user);
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword });
  return sendSuccess(res, 'Đổi mật khẩu thành công');
};

