import { z } from 'zod';

// Common validation schemas
const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// Questionnaire type validations
const questionnaireStatusSchema = z.enum(['draft', 'published', 'archived'], {
  message: 'Invalid questionnaire status',
});

const questionTypeSchema = z.enum(['text', 'dropdown', 'radio', 'date'], {
  message: 'Invalid question type',
});

const responseStatusSchema = z.enum(
  ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
  {
    message: 'Invalid response status',
  }
);

// =======================
// Questionnaire Validations
// =======================

export const createQuestionnaireSchema = z.object({
  body: z.object({
    taxYear: z
      .number({ message: 'Tax year must be a valid year' })
      .int({ message: 'Tax year must be a valid year' })
      .min(2020, 'Tax year must be between 2020 and 2030')
      .max(2030, 'Tax year must be between 2020 and 2030'),
  }),
});
export const importQuestionnaireSchema = z.object({
  body: z.object({
    taxYear: z
      .number({ message: 'Tax year must be a valid year' })
      .int({ message: 'Tax year must be a valid year' })
      .min(2020, 'Tax year must be between 2020 and 2030')
      .max(2030, 'Tax year must be between 2020 and 2030'),
    importFromTaxYear: z
      .number({ message: 'Tax year to be imported must be a valid year' })
      .int({ message: 'Tax year to be imported must be a valid year' })
      .min(2020, 'Tax year to be imported must be between 2020 and 2030')
      .max(2030, 'Tax year to be imported must be between 2020 and 2030'),
  }),
});

export const updateQuestionnaireSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    taxYear: z
      .number({ message: 'Tax year must be a valid year' })
      .int({ message: 'Tax year must be a valid year' })
      .min(2020, 'Tax year must be between 2020 and 2030')
      .max(2030, 'Tax year must be between 2020 and 2030')
      .optional(),
    title: z.string().min(1, 'Title cannot be empty').optional(),
    description: z.string().optional(),
    status: questionnaireStatusSchema.optional(),
  }),
});

export const publishQuestionnaireSchema = z.object({
  params: z.object({
    questionnaireId: uuidSchema,
  }),
});

export const listQuestionnairesSchema = z.object({
  query: z.object({
    taxYear: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    status: questionnaireStatusSchema.optional(),
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
// Question Category Validations
// =======================

export const createQuestionCategorySchema = z.object({
  body: z.object({
    questionnaireId: uuidSchema,
    name: z
      .string({ message: 'Name is required' })
      .min(1, 'Name cannot be empty')
      .refine((val) => val.trim().length > 0, { message: 'Name cannot be empty' }),
    description: z.string().optional(),
    sortOrder: z.number().int().min(0).default(0),
  }),
});

export const updateQuestionCategorySchema = z.object({
  params: z.object({
    categoryId: uuidSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .refine((val) => val.trim().length > 0, { message: 'Name cannot be empty' })
      .optional(),
    description: z.string().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const deleteQuestionCategorySchema = z.object({
  params: z.object({
    categoryId: uuidSchema,
  }),
});

// =======================
// Question Validations
// =======================

export const createQuestionSchema = z.object({
  body: z.object({
    categoryId: uuidSchema,
    questionText: z
      .string({ message: 'Question text is required' })
      .min(1, 'Question text cannot be empty'),
    helpText: z.string().optional(),
    placeholder: z.string().optional(),
    questionType: questionTypeSchema,
    isRequired: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
    options: z
      .array(
        z.object({
          value: z.string().min(1, 'Option value cannot be empty'),
          label: z.string().min(1, 'Option label cannot be empty'),
          order: z.number().int().min(0).default(0),
          isDocumentRequired: z.boolean({ message: 'isDocumentRequired is required for options' }),
          documentCategoryId: uuidSchema.optional(),
        })
      )
      .optional(),
    parentQuestionId: uuidSchema.optional(),
    showIfParentOptionValue: z.string().optional(),
  }),
});

export const updateQuestionSchema = z.object({
  params: z.object({
    questionId: uuidSchema,
  }),
  body: z.object({
    questionText: z.string().min(1, 'Question text cannot be empty').optional(),
    helpText: z.string().optional(),
    placeholder: z.string().optional(),
    questionType: questionTypeSchema.optional(),
    isRequired: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    options: z
      .array(
        z.object({
          value: z.string().min(1, 'Option value cannot be empty'),
          label: z.string().min(1, 'Option label cannot be empty'),
          order: z.number().int().min(0).default(0),
          isDocumentRequired: z.boolean({ message: 'isDocumentRequired is required for options' }),
          documentCategoryId: uuidSchema.optional(),
        })
      )
      .optional(),
    parentQuestionId: uuidSchema.optional(),
    showIfParentOptionValue: z.string().optional(),
  }),
});

export const deleteQuestionSchema = z.object({
  params: z.object({
    questionId: uuidSchema,
  }),
});

// =======================
// Questionnaire Response Validations
// =======================

export const createQuestionnaireResponseSchema = z.object({
  body: z.object({
    questionnaireId: uuidSchema,
    applicationId: uuidSchema,
  }),
});

export const updateQuestionnaireResponseSchema = z.object({
  params: z.object({
    responseId: uuidSchema,
  }),
  body: z.object({
    currentCategoryId: uuidSchema.optional(),
    completionPercentage: z.number().int().min(0).max(100).optional(),
  }),
});

export const submitQuestionnaireResponseSchema = z.object({
  body: z.object({
    responseId: uuidSchema,
  }),
});

export const listQuestionnaireResponsesSchema = z.object({
  query: z.object({
    questionnaireId: uuidSchema.optional(),
    applicationId: uuidSchema.optional(),
    status: responseStatusSchema.optional(),
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
// Answer Validations
// =======================

export const saveAnswerSchema = z.object({
  body: z.object({
    responseId: uuidSchema,
    questionId: uuidSchema,
    answer: z.union([z.string(), z.number(), z.boolean(), z.date()]).nullable(),
    isDeselected: z.boolean().optional(),
  }),
});

// =======================
// Common ID param validations
// =======================

export const idParamSchema = z.object({
  params: z.object({
    questionnaireId: uuidSchema,
  }),
});

export const questionnaireIdParamSchema = z.object({
  params: z.object({
    questionnaireId: uuidSchema,
  }),
});

export const responseIdParamSchema = z.object({
  params: z.object({
    responseId: uuidSchema,
  }),
});

export const applicationIdParamSchema = z.object({
  params: z.object({
    applicationId: uuidSchema,
  }),
});

export const questionIdParamSchema = z.object({
  params: z.object({
    questionId: uuidSchema,
  }),
});
