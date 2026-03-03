import { z } from 'zod';

// Common validation schemas
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// =======================
// Blog Validations
// =======================

export const createBlogSchema = z.object({
  body: z.object({
    title: z.string({ message: 'Title is required' }).min(1, 'Title cannot be empty').max(255),
    excerpt: z.string().optional(),
    content: z.string({ message: 'Content is required' }).min(1, 'Content cannot be empty'),
    status: z.boolean().default(true), // true = published, false = draft

    // Feature flags
    isFeatured: z.boolean().default(false),
    featuredOrder: z.number().int().min(0).default(0),
  }),
});

export const updateBlogSchema = z.object({
  params: z.object({
    blogId: uuidSchema,
  }),
  body: z.object({
    title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
    status: z.boolean().optional(),

    // Feature flags
    isFeatured: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).optional(),
  }),
});

export const publishBlogSchema = z.object({
  params: z.object({
    blogId: uuidSchema,
  }),
});

export const deleteBlogSchema = z.object({
  params: z.object({
    blogId: uuidSchema,
  }),
});

export const listBlogsSchema = z.object({
  query: z.object({
    status: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    isPublished: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    isFeatured: z
      .string()
      .optional()
      .transform((val) => val === 'true'),
    authorId: uuidSchema.optional(),
    search: z.string().optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

// =======================
// Common param validations
// =======================

export const blogIdParamSchema = z.object({
  params: z.object({
    blogId: uuidSchema,
  }),
});

export const blogSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Slug is required'),
  }),
});
