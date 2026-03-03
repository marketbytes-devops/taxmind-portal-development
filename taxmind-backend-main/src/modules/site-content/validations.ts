import { z } from 'zod';

import { policyTypesArr } from '@/constants';

// Common validation schemas
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });
const statusSchema = z.boolean().optional();

// FAQ Validations
export const createFaqSchema = z.object({
  body: z.object({
    question: z.string({ message: 'Question is required' }).min(1, 'Question cannot be empty'),
    answer: z.string({ message: 'Answer is required' }).min(1, 'Answer cannot be empty'),
    status: statusSchema,
  }),
});

export const updateFaqSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    question: z.string().min(1, 'Question cannot be empty').optional(),
    answer: z.string().min(1, 'Answer cannot be empty').optional(),
    status: statusSchema,
  }),
});

export const deleteFaqSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Social Media Validations
export const createSocialMediaSchema = z.object({
  body: z.object({
    platform: z.string({ message: 'Platform is required' }).min(1, 'Platform cannot be empty'),
    url: z.string({ message: 'URL is required' }).url({ message: 'Invalid URL format' }),
  }),
});

export const updateSocialMediaSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    platform: z.string().min(1, 'Platform cannot be empty').optional(),
    url: z.url({ message: 'Invalid URL format' }).optional(),
  }),
});

export const deleteSocialMediaSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Tax Credits Validations
export const createTaxCreditSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
    description: z
      .string({ message: 'Description is required' })
      .min(1, 'Description cannot be empty'),
    details: z.string({ message: 'Details are required' }).min(1, 'Details cannot be empty'),
    status: statusSchema,
  }),
});

export const updateTaxCreditSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    description: z.string().min(1, 'Description cannot be empty').optional(),
    details: z.string().min(1, 'Details cannot be empty').optional(),
    status: statusSchema,
  }),
});

export const deleteTaxCreditSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Carousel Images Validations
export const createCarouselImageSchema = z.object({
  body: z.object({
    // No fields needed initially - entity created without image
    // Image will be associated through files API
  }),
});

export const deleteCarouselImageSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Document Templates Validations
export const createDocumentTemplateSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
    description: z.string().optional(),
  }),
});

export const updateDocumentTemplateSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    description: z.string().optional(),
  }),
});

export const deleteDocumentTemplateSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Policies Validations
export const createPolicySchema = z.object({
  body: z.object({
    type: z.enum(policyTypesArr as [string, ...string[]], { message: 'Invalid policy type' }),
    content: z.string({ message: 'Content is required' }).min(1, 'Content cannot be empty'),
    // isActive: z.boolean().optional(),
  }),
});

export const getActivePolicySchema = z.object({
  query: z.object({
    type: z.enum(policyTypesArr as [string, ...string[]], { message: 'Invalid policy type' }),
  }),
});

export const updatePolicySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    // type: z
    //   .enum(policyTypesArr as [string, ...string[]], { message: 'Invalid policy type' })
    //   .optional(),
    content: z.string().min(1, 'Content cannot be empty'),
    // isActive: z.boolean().optional(),
  }),
});

export const deletePolicySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Query Categories Validations
export const createQueryCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ message: 'Name is required' })
      .min(1, 'Name cannot be empty')
      .max(200, 'Name too long'),
    description: z.string().optional(),
  }),
});

export const updateQueryCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').max(200, 'Name too long').optional(),
    description: z.string().optional(),
  }),
});

export const deleteQueryCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Document Categories Validations
export const createDocumentCategorySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
    description: z.string().optional(),
  }),
});

export const updateDocumentCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    description: z.string().optional(),
  }),
});

export const deleteDocumentCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Site Contents Validations (Global site configuration)
export const updateSiteContentsSchema = z.object({
  body: z.object({
    homeTitle: z.string().min(1, 'Home title cannot be empty').optional(),
    homeContent: z.string().min(1, 'Home content cannot be empty').optional(),
    headerEmail: z.email('Invalid email format').optional(),
    headerPhone: z
      .string()
      .min(1, 'Header phone cannot be empty')
      .max(20, 'Header phone too long')
      .optional(),
    aboutUsContent: z.string().min(1, 'About us content cannot be empty').optional(),
    commissionPercentage: z
      .number()
      .min(1, 'Minimum commission percentage is 1')
      .max(99, 'Commission percentage cannot exceed 99')
      .optional(),
    vaPercentage: z
      .number()
      .min(0, 'Minimum VA percentage is 0')
      .max(99, 'VA percentage cannot exceed 99')
      .optional(),
  }),
});

// Common ID param validation
export const idParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
