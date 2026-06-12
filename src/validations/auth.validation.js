import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z.string({ required_error: 'Tên không được để trống' })
      .min(2, 'Tên phải chứa ít nhất 2 ký tự')
      .max(50, 'Tên không được vượt quá 50 ký tự')
      .trim(),
    email: z.string({ required_error: 'Email không được để trống' })
      .email('Email không đúng định dạng')
      .trim()
      .toLowerCase(),
    password: z.string({ required_error: 'Mật khẩu không được để trống' })
      .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string({ required_error: 'Email không được để trống' })
      .email('Email không đúng định dạng')
      .trim()
      .toLowerCase(),
    password: z.string({ required_error: 'Mật khẩu không được để trống' }),
  }),
};
