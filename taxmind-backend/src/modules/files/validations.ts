import { z } from 'zod';

// Upload types and their configurations
export const uploadTypes = {
  chat_attachment: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    expirationMinutes: 10,
  },
  application_document_direct: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 10,
  },
  blog_image: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
  application_document: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 10,
  },
  tax_return_document: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    expirationMinutes: 10,
  },
  carousel_image: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
  social_media_logo: {
    allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
  tax_credit_icon: {
    allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
  document_template: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
  question_category_icon: {
    allowedMimeTypes: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxFiles: 1,
    expirationMinutes: 5,
  },
} as const;

export type UploadType = keyof typeof uploadTypes;

// Helper function to get MIME type from file extension
const getExpectedMimeType = (filename: string): string | null => {
  const fileExtension = filename.toLowerCase().split('.').pop();
  if (!fileExtension) return null;

  const extensionMimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return extensionMimeMap[fileExtension] || null;
};

// Validation schema for requesting pre-signed upload URL
export const requestPresignedUrlSchema = z
  .object({
    body: z.object({
      entityId: z.uuid('Invalid entity ID format').nullable().optional(), // Allow null for new entities
      type: z.enum([
        'blog_image',
        'application_document',
        'tax_return_document',
        'carousel_image',
        'social_media_logo',
        'tax_credit_icon',
        'document_template',
        'question_category_icon',
        'application_document_direct',
        'chat_attachment',
      ]),
      filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
      metadata: z
        .union([
          z.object({
            applicationId: z.uuid('Invalid applicationId format'),
            documentCategoryId: z.uuid('Invalid documentCategoryId format'), // For application document direct
          }),
          z.object({
            templateName: z.string(), // For document templates
          }),
        ])
        .optional(),
    }),
  })
  .refine(
    (data) => {
      const { type, filename, metadata } = data.body;
      const config = uploadTypes[type];
      const expectedMimeType = getExpectedMimeType(filename);

      // Validate required fields for application_document_direct
      if (type === 'application_document_direct') {
        if (!metadata || typeof metadata !== 'object') return false;
        if (!('applicationId' in metadata) || !('documentCategoryId' in metadata)) return false;
        // UUID format is already checked by Zod above
      }

      if (
        !expectedMimeType ||
        !(config.allowedMimeTypes as readonly string[]).includes(expectedMimeType)
      ) {
        return false;
      }

      return true;
    },
    {
      message: 'File type not allowed for this upload type or missing required metadata fields',
    }
  );

// Validation schema for confirming file upload
export const confirmFileUploadSchema = z.object({
  body: z.object({
    keys: z.array(z.string().min(1, 'S3 key is required')).min(1, 'At least one key is required'),
  }),
});

// Validation schema for file ID parameter
export const fileIdParamSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid file ID format'),
  }),
});

// Validation schema for getting file
export const getFileSchema = fileIdParamSchema;

// Validation schema for deleting file
export const deleteFileSchema = fileIdParamSchema;

export type FileType = 'image' | 'document' | 'icon';

export const deleteFileWithAssociationSchema = z.object({
  body: z.object({
    fileId: z.uuid('Invalid file ID format'), // Allow null for new entities
    type: z.enum([
      'blog_image',
      'application_document',
      'tax_return_document',
      'carousel_image',
      'social_media_logo',
      'tax_credit_icon',
      'document_template',
      'question_category_icon',
      'application_document_direct',
      'chat_attachment',
    ]),
  }),
});
