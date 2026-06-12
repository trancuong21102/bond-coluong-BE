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

const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug không được để trống'),
});

// Helper to preprocess form-data checkbox / string flags into actual booleans
const preprocessBoolean = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (typeof val === 'boolean') return val;
  return undefined;
}, z.boolean().default(true));

const preprocessBooleanOptional = z.preprocess((val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (typeof val === 'boolean') return val;
  return undefined;
}, z.boolean().optional());

export const createCategorySchema = {
  body: z.object({
    name: z.string({ required_error: 'Tên danh mục không được để trống' })
      .min(2, 'Tên danh mục phải chứa ít nhất 2 ký tự')
      .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
      .trim(),
    description: z.string().optional(),
    isPublic: preprocessBoolean,
  }),
};

export const updateCategorySchema = {
  params: idParamSchema,
  body: z.object({
    name: z.string()
      .min(2, 'Tên danh mục phải chứa ít nhất 2 ký tự')
      .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
      .trim()
      .optional(),
    description: z.string().optional(),
    isPublic: preprocessBooleanOptional,
  }),
};

export const deleteCategorySchema = {
  params: idParamSchema,
};

export const getCategoryBySlugSchema = {
  params: slugParamSchema,
};
