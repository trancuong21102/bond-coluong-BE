import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ID phải là số nguyên',
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

const preprocessBoolean = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (typeof val === 'boolean') return val;
  return undefined;
}, z.boolean().default(true));

const preprocessInt = (fieldName) => z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof val === 'number') return val;
  return undefined;
}, z.number().int(`${fieldName} phải là số nguyên`));

const preprocessIntOptional = (fieldName) => z.preprocess((val) => {
  if (typeof val === 'string' && val.trim() !== '') {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  if (typeof val === 'number') return val;
  return undefined;
}, z.number().int(`${fieldName} phải là số nguyên`).optional());

export const uploadImageSchema = {
  body: z.object({
    title: z.string({ required_error: 'Tiêu đề ảnh không được để trống' })
      .min(2, 'Tiêu đề ảnh phải chứa ít nhất 2 ký tự')
      .max(100, 'Tiêu đề ảnh không được vượt quá 100 ký tự')
      .trim(),
    description: z.string().optional(),
    categoryId: preprocessInt('Mã danh mục (categoryId)'),
    isPublic: preprocessBoolean,
  }),
};

export const deleteImageSchema = {
  params: idParamSchema,
};

export const rejectImageSchema = {
  params: idParamSchema,
  body: z.object({
    rejectReason: z.string({ required_error: 'Lý do từ chối không được để trống' })
      .min(3, 'Lý do từ chối phải chứa ít nhất 3 ký tự')
      .trim(),
  }),
};

export const approveImageSchema = {
  params: idParamSchema,
};

export const togglePublicSchema = {
  params: idParamSchema,
};

export const publicImagesQuerySchema = {
  query: z.object({
    categoryId: preprocessIntOptional('Mã danh mục (categoryId)'),
    categorySlug: z.string().trim().optional(),
    page: z.preprocess((val) => {
      const parsed = parseInt(val || '1', 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }, z.number().int().default(1)),
    limit: z.preprocess((val) => {
      const parsed = parseInt(val || '10', 10);
      return isNaN(parsed) || parsed < 1 ? 10 : parsed;
    }, z.number().int().default(10)),
    search: z.string().trim().optional(),
  }),
};

export const adminImagesQuerySchema = {
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    categoryId: preprocessIntOptional('Mã danh mục (categoryId)'),
    uploadedById: preprocessIntOptional('Mã người dùng (uploadedById)'),
    page: z.preprocess((val) => {
      const parsed = parseInt(val || '1', 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }, z.number().int().default(1)),
    limit: z.preprocess((val) => {
      const parsed = parseInt(val || '10', 10);
      return isNaN(parsed) || parsed < 1 ? 10 : parsed;
    }, z.number().int().default(10)),
    search: z.string().trim().optional(),
  }),
};
