import { z } from 'zod';

import { applicationStatusesArr, paymentMethodsArr } from '@/constants';

export const startApplicationSchema = z.object({
  body: z.object({
    year: z.number().int().min(2000).max(3000),
    isAmendment: z.boolean().optional(),
    parentApplicationId: z.uuid().nullable().optional(),
  }),
});

export const listApplicationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

// Admin: list all applications with optional filters
export const listApplicationsAdminSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    status: z.enum(applicationStatusesArr).optional(),
    year: z.coerce.number().int().optional(),
    userId: z.string().uuid('Invalid user ID').optional(),
    search: z.string().max(100).optional(), // matches applicationNo
    paymentStatus: z.enum(['pending', 'completed', 'failed']).optional(),
    ignoreRefundCompleted: z.enum(['true', 'false']).optional(),
  }),
});

// Admin Application list of a particular user
export const listApplicationsOfUserSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    userId: z.string().uuid('Invalid user ID').optional(),
    status: z.enum(applicationStatusesArr).optional(),
  }),
});
// Admin: get a specific application by id
export const getApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().uuid('Invalid application ID'),
  }),
});

export const applicationIdParamSchema = z.object({
  params: z.object({
    applicationId: z.uuid('Invalid application ID'),
  }),
});

export const getApplicationStepSchema = z.object({
  params: z.object({
    applicationId: z.uuid('Invalid application ID'),
    key: z.enum([
      'questionnaire',
      'documents',
      'agent_activation',
      'review',
      'processing',
      'refund',
    ]),
  }),
});

// Application Notes (admin)
export const createApplicationNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note is required').max(5000, 'Note too long'),
    applicationId: z.uuid('Invalid application ID'),
  }),
});

export const listApplicationNotesSchema = z.object({
  params: z.object({
    applicationId: z.uuid('Invalid application ID'),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

// Admin: Document Requests
export const createDocumentRequestSchema = z.object({
  body: z.object({
    applicationId: z.uuid('Invalid application ID'),
    documentCategoryId: z.uuid('Invalid document category ID'),
    isRequired: z.boolean().default(true),
    note: z.string().max(2000).optional(),
  }),
});

export const updateDocumentRequestStatusSchema = z.object({
  params: z.object({
    applicationDocumentCategoryId: z.uuid('Invalid document request ID'),
  }),
  body: z.object({
    status: z.enum(['accepted', 'rejected', 'withdrawn']),
    rejectedReason: z.string().max(2000).optional(),
  }),
});

// Admin: Application status updates
export const setDocumentsVerifiedStatusSchema = z.object({
  params: z.object({ applicationId: z.uuid('Invalid application ID') }),
});

//User: check if all required documents are uploaded for an application
export const checkDocumentsUploadedStatusSchema = z.object({
  params: z.object({ applicationId: z.uuid('Invalid application ID') }),
});

export const setReviewedStatusSchema = z.object({
  params: z.object({ applicationId: z.uuid('Invalid application ID') }),
});

// Admin: Amount calculations
export const calculateApplicationAmountsSchema = z.object({
  body: z.object({
    refundAmount: z.number().min(0),
    discountAmount: z.number().min(0).default(0).optional(),
    flatFee: z.number().min(0).default(0).optional(),
  }),
});

export const submitApplicationAmountsSchema = z.object({
  body: z.object({
    applicationId: z.uuid('Invalid application ID'),
    refundAmount: z.number().min(0),
    discountAmount: z.number().min(0).default(0).optional(),
    flatFee: z.number().min(0).default(0).optional(),
  }),
});

// Users: submit offline payment request after refund is completed
export const createOfflinePaymentRequestSchema = z.object({
  body: z.object({
    applicationId: z.uuid('Invalid application ID'),
  }),
});

export type CreateOfflinePaymentRequestInput = z.infer<typeof createOfflinePaymentRequestSchema>;

// Admin: approve/reject offline payment requests
export const approveOfflinePaymentRequestSchema = z.object({
  body: z.object({
    offlinePaymentRequestId: z.uuid('Invalid offline payment request ID'),
    paymentMethod: z.enum(paymentMethodsArr),
    transactionId: z.string().optional(),
  }),
});

export const rejectOfflinePaymentRequestSchema = z.object({
  body: z.object({
    offlinePaymentRequestId: z.uuid('Invalid offline payment request ID'),
    rejectionReason: z.string().min(1, 'Rejection reason is required').max(2000),
    rejectionCategory: z.string().max(200).optional(),
  }),
});

export const createPaymentCheckoutSchema = z.object({
  body: z.object({
    applicationId: z.uuid(),
  }),
});

export const paymentWebhookSchema = z.object({
  body: z.object({
    event: z.string(),
    type: z.string().optional(),
    data: z.any(),
  }),
  headers: z
    .object({
      'revolut-signature': z.string().optional(),
    })
    .passthrough(),
});

export const listCompletedPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().max(200).optional(), // match by user name or user email (if decrypted accessible)
  }),
});

export const listPendingOfflinePaymentRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().max(200).optional(), // match by user name or user email (if decrypted accessible)
  }),
});
export const listRejectedOfflinePaymentRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().max(200).optional(), // match by user name or user email (if decrypted accessible)
  }),
});

// =======================
// Application Reviews
// =======================

export const createApplicationReviewSchema = z.object({
  body: z.object({
    applicationId: z.uuid('Invalid application ID'),
    rating: z.number().int().min(1).max(5),
    review: z.string().max(2000),
  }),
});

export const listApplicationReviewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    size: z.coerce.number().int().min(1).max(100).default(20).optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    applicationId: z.uuid().optional(),
  }),
});

export const getApplicationReviewSchema = z.object({
  params: z.object({ id: z.uuid('Invalid review ID') }),
});

export const updateApplicationReviewStatusSchema = z.object({
  params: z.object({ id: z.uuid('Invalid review ID') }),
  body: z.object({ status: z.enum(['approved', 'rejected']) }),
});

export const processTaxReturnSchema = z.object({
  params: z.object({
    applicationId: z.uuid('Invalid application ID'),
  }),
});

export const confirmTaxReturnSchema = z.object({
  params: z.object({
    applicationId: z.uuid('Invalid application ID'),
  }),
  body: z.object({
    summary: z.string().min(1, 'Summary is required'),
    maskedFileId: z.uuid().optional(),
  }),
});
