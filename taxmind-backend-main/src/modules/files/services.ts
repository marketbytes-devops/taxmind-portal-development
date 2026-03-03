import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { z } from 'zod';

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { applicationStatuses } from '@/constants';
import { db, models } from '@/database';
import { generateUniqueFileName, getPresignedGetObjectUrl } from '@/integrations/awsS3';
import logger from '@/logger';
import ApiError from '@/utils/apiError';
import { hashWithHMAC } from '@/utils/crypto';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  type UploadType,
  confirmFileUploadSchema,
  deleteFileSchema,
  deleteFileWithAssociationSchema,
  getFileSchema,
  requestPresignedUrlSchema,
  uploadTypes,
} from './validations';

// S3 Client setup
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
  region: process.env.AWS_REGION,
});

// Helper function to delete file from S3 and database
const deleteFileFromS3AndDB = async (fileId: string) => {
  try {
    // Get file details from database
    const file = await db.query.files.findFirst({
      where: eq(models.files.id, fileId),
      columns: { key: true },
    });

    if (file) {
      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: file.key,
      });
      await s3Client.send(deleteCommand);

      // Delete from database
      await db.delete(models.files).where(eq(models.files.id, fileId));

      logger.info(`File deleted from S3 and database: ${file.key}`);
    }
  } catch (error) {
    logger.error(`Error deleting file ${fileId}:`, error);
    // Don't throw error here to avoid breaking the main flow
  }
};

// Helper function to get MIME type from file extension
const getMimeTypeFromFilename = (filename: string): string => {
  const fileExtension = filename.toLowerCase().split('.').pop();
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
  return extensionMimeMap[fileExtension || ''] || 'application/octet-stream';
};

// Helper function to associate file with entity based on upload type
const associateFileWithEntity = async (
  fileId: string,
  entityId: string,
  uploadType: UploadType,
  uploadedUserId: string
) => {
  switch (uploadType) {
    case 'blog_image': {
      // Check for existing image to delete
      const blog = await db.query.blogs.findFirst({
        where: and(isNull(models.blogs.deletedAt), eq(models.blogs.id, entityId)),
        columns: { imageId: true },
      });

      // Delete old image if it exists
      if (blog?.imageId) {
        await deleteFileFromS3AndDB(blog.imageId);
      }

      // Update blog with new image
      await db
        .update(models.blogs)
        .set({ imageId: fileId, updatedAt: new Date() })
        .where(eq(models.blogs.id, entityId));
      break;
    }

    case 'social_media_logo': {
      // Check for existing icon to delete
      const socialMedia = await db.query.socialMedias.findFirst({
        where: eq(models.socialMedias.id, entityId),
        columns: { iconId: true },
      });

      // Delete old icon if it exists
      if (socialMedia?.iconId) {
        await deleteFileFromS3AndDB(socialMedia.iconId);
      }

      // Update social media with new icon
      await db
        .update(models.socialMedias)
        .set({ iconId: fileId })
        .where(eq(models.socialMedias.id, entityId));
      break;
    }

    case 'tax_credit_icon': {
      // Check for existing icon to delete
      const taxCredit = await db.query.tax_credits.findFirst({
        where: and(isNull(models.tax_credits.deletedAt), eq(models.tax_credits.id, entityId)),
        columns: { iconId: true },
      });

      // Delete old icon if it exists
      if (taxCredit?.iconId) {
        await deleteFileFromS3AndDB(taxCredit.iconId);
      }

      // Update tax credit with new icon
      await db
        .update(models.tax_credits)
        .set({ iconId: fileId, updatedAt: new Date() })
        .where(eq(models.tax_credits.id, entityId));
      break;
    }

    case 'question_category_icon': {
      // Check for existing icon to delete
      const category = await db.query.questionCategories.findFirst({
        where: eq(models.questionCategories.id, entityId),
        columns: { iconId: true },
      });

      if (category?.iconId) {
        await deleteFileFromS3AndDB(category.iconId);
      }

      await db
        .update(models.questionCategories)
        .set({ iconId: fileId, updatedAt: new Date() })
        .where(eq(models.questionCategories.id, entityId));
      break;
    }

    case 'application_document': {
      // For applications, entityId should be applicationDocumentCategoryId
      // Validate application status
      const appDocCat = await db.query.applicationDocumentCategories.findFirst({
        where: and(
          isNull(models.applicationDocumentCategories.deletedAt),
          eq(models.applicationDocumentCategories.id, entityId)
        ),
        columns: { applicationId: true },
      });
      if (!appDocCat) throw new ApiError('Application document category not found', 404);
      const app = await db.query.applications.findFirst({
        where: eq(models.applications.id, appDocCat.applicationId),
        columns: { status: true },
      });
      if (!app) throw new ApiError('Application not found', 404);
      const allowedStatuses = [
        applicationStatuses.SUBMITTED,
        applicationStatuses.DOCUMENTS_UPLOAD_PENDING,
        applicationStatuses.DOCUMENTS_UPLOADED,
        // applicationStatuses.DOCUMENTS_VERIFIED,
        // applicationStatuses.REVIEWED,
      ];
      if (!allowedStatuses.includes(app.status)) {
        throw new ApiError(
          'Document upload not allowed: application document already verified',
          409
        );
      }
      await db.insert(models.applicationDocumentCategoryFiles).values({
        applicationDocumentCategoryId: entityId,
        fileId: fileId,
      });

      await db
        .update(models.applicationDocumentCategories)
        .set({ status: 'pending' })
        .where(eq(models.applicationDocumentCategories.id, entityId));

      await db
        .update(models.applications)
        .set({ status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING })
        .where(eq(models.applications.id, appDocCat.applicationId));
      break;
    }

    case 'tax_return_document': {
      // Replace existing tax return document (only allowed while processing)
      const app = await db.query.applications.findFirst({
        where: and(isNull(models.applications.deletedAt), eq(models.applications.id, entityId)),
        columns: { id: true, status: true, taxReturnDocumentId: true },
      });
      if (!app) throw new ApiError('Application not found', 404);
      if (app.status === applicationStatuses.REFUND_COMPLETED) {
        throw new ApiError('Cannot upload: application is already refund completed', 409);
      }
      if (app.status !== applicationStatuses.PROCESSING) {
        throw new ApiError('Tax return document can be uploaded only in processing state', 409);
      }

      // Delete old file if exists
      if (app.taxReturnDocumentId) {
        await deleteFileFromS3AndDB(app.taxReturnDocumentId);
      }

      // Associate new file
      await db
        .update(models.applications)
        .set({
          taxReturnDocumentId: fileId,
          taxReturnDocumentUploadedAt: new Date(),
          taxReturnDocumentUploadedBy: uploadedUserId,
        })
        .where(eq(models.applications.id, entityId));
      break;
    }

    default:
      throw new ApiError(`Unsupported upload type: ${uploadType}`, 400);
  }
};

// Helper function to disassociate file from entity based on upload type
const disAssociateFileWithEntity = async (fileId: string, uploadType: UploadType) => {
  switch (uploadType) {
    case 'blog_image': {
      // Update blog with image null
      await db
        .update(models.blogs)
        .set({ imageId: null, updatedAt: new Date() })
        .where(eq(models.blogs.imageId, fileId));
      break;
    }

    case 'social_media_logo': {
      // Update social media with icon null
      await db
        .update(models.socialMedias)
        .set({ iconId: null })
        .where(eq(models.socialMedias.iconId, fileId));
      break;
    }

    case 'tax_credit_icon': {
      // Update tax credit with icon null
      await db
        .update(models.tax_credits)
        .set({ iconId: null, updatedAt: new Date() })
        .where(eq(models.tax_credits.iconId, fileId));
      break;
    }

    case 'question_category_icon': {
      // Update question category with icon null

      await db
        .update(models.questionCategories)
        .set({ iconId: null, updatedAt: new Date() })
        .where(eq(models.questionCategories.iconId, fileId));
      break;
    }

    case 'application_document': {
      // For applications, fileId is connected to applicationDocumentCategoryFilesId
      await db
        .delete(models.applicationDocumentCategoryFiles)
        .where(eq(models.applicationDocumentCategoryFiles.fileId, fileId));
      break;
    }

    case 'tax_return_document': {
      await db
        .update(models.applications)
        .set({
          taxReturnDocumentId: null,
          taxReturnDocumentUploadedAt: null,
          taxReturnDocumentUploadedBy: null,
        })
        .where(eq(models.applications.taxReturnDocumentId, fileId));
      break;
    }

    default:
      throw new ApiError(`Unsupported upload type: ${uploadType}`, 400);
  }
};
type ApplicationDocumentDirectMeta = { applicationId: string; documentCategoryId: string };
type DocumentTemplateMeta = { templateName: string };
type GenericMeta =
  | ApplicationDocumentDirectMeta
  | DocumentTemplateMeta
  | Record<string, unknown>
  | undefined;

const fileFirstAssociations = async (
  fileId: string,
  uploadType: UploadType,
  metadata: GenericMeta
) => {
  switch (uploadType) {
    case 'carousel_image': {
      await db.insert(models.carouselImages).values({ imageId: fileId });
      break;
    }

    case 'document_template': {
      if (!metadata || typeof metadata !== 'object' || !('templateName' in metadata)) {
        throw new ApiError('Template name is required for document_template uploads', 400);
      }
      await db
        .insert(models.documentTemplates)
        .values({ name: (metadata as DocumentTemplateMeta).templateName, templateFileId: fileId });
      break;
    }

    case 'application_document_direct': {
      // Only admins can use this upload type
      if (
        !metadata ||
        typeof metadata !== 'object' ||
        !('applicationId' in metadata) ||
        !('documentCategoryId' in metadata)
      ) {
        throw new ApiError('applicationId and documentCategoryId are required in metadata', 400);
      }
      const { applicationId, documentCategoryId } = metadata as ApplicationDocumentDirectMeta;
      // Validate applicationId exists
      const app = await db.query.applications.findFirst({
        where: and(
          isNull(models.applications.deletedAt),
          eq(models.applications.id, applicationId)
        ),
        columns: { id: true, status: true },
        with: { applicationStatusHistories: { columns: { status: true } } },
      });

      if (!app) throw new ApiError('Application not found', 404);

      const appStatusHistorySet = new Set(app.applicationStatusHistories.map((h) => h.status));
      if (appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED)) {
        throw new ApiError(
          'Cannot upload application document: application document already verified',
          409
        );
      }

      // Validate documentCategoryId exists
      const docCat = await db.query.documentCategories.findFirst({
        where: and(
          isNull(models.documentCategories.deletedAt),
          eq(models.documentCategories.id, documentCategoryId)
        ),
        columns: { id: true },
      });
      if (!docCat) throw new ApiError('Document category not found', 404);

      // Validate application status
      const allowedStatuses = [
        applicationStatuses.SUBMITTED,
        applicationStatuses.DOCUMENTS_UPLOAD_PENDING,
        applicationStatuses.DOCUMENTS_UPLOADED,
      ];
      if (!allowedStatuses.includes(app.status)) {
        throw new ApiError(
          'Document upload not allowed: application document already verified',
          409
        );
      }
      // Check if applicationDocumentCategories exists
      let appDocCat = await db.query.applicationDocumentCategories.findFirst({
        where: and(
          eq(models.applicationDocumentCategories.applicationId, applicationId),
          eq(models.applicationDocumentCategories.documentCategoryId, documentCategoryId),
          isNull(models.applicationDocumentCategories.deletedAt)
        ),
      });
      if (!appDocCat) {
        // Create new applicationDocumentCategories record
        const [createdCat] = await db
          .insert(models.applicationDocumentCategories)
          .values({
            applicationId,
            documentCategoryId,
            isRequired: true,
            isAdditionalDocument: true,
            status: 'pending',
          })
          .returning();
        appDocCat = createdCat;
      } else {
        await db
          .update(models.applicationDocumentCategories)
          .set({ status: 'pending' })
          .where(eq(models.applicationDocumentCategories.id, appDocCat.id));
      }
      // Insert into applicationDocumentCategoryFiles
      await db.insert(models.applicationDocumentCategoryFiles).values({
        applicationDocumentCategoryId: appDocCat.id,
        fileId,
      });

      await db
        .update(models.applications)
        .set({ status: applicationStatuses.DOCUMENTS_UPLOAD_PENDING })
        .where(eq(models.applications.id, applicationId));
      break;
    }

    case 'chat_attachment': {
      // No immediate association required here; chat message service will link fileId later.
      break;
    }

    default:
      throw new ApiError(`Unsupported upload type: ${uploadType}`, 400);
  }
};
const fileFirstDisAssociations = async (fileId: string, uploadType: UploadType) => {
  switch (uploadType) {
    case 'carousel_image': {
      await db.delete(models.carouselImages).where(eq(models.carouselImages.imageId, fileId));
      break;
    }

    case 'document_template': {
      await db
        .delete(models.documentTemplates)
        .where(eq(models.documentTemplates.templateFileId, fileId));
      break;
    }

    case 'application_document_direct': {
      await db
        .delete(models.applicationDocumentCategoryFiles)
        .where(eq(models.applicationDocumentCategoryFiles.fileId, fileId));
      break;
    }

    case 'chat_attachment': {
      // No immediate association required here; chat message service will link fileId later.
      break;
    }

    default:
      throw new ApiError(`Unsupported upload type: ${uploadType}`, 400);
  }
};

// Helper function to validate entity exists or create if needed
const validateEntityExists = async (entityId: string, uploadType: UploadType) => {
  if (!entityId) return;

  // Validate existing entity
  switch (uploadType) {
    case 'blog_image': {
      const blog = await db.query.blogs.findFirst({
        where: and(isNull(models.blogs.deletedAt), eq(models.blogs.id, entityId)),
      });
      if (!blog) throw new ApiError('Blog not found', 404);
      break;
    }

    case 'social_media_logo': {
      const socialMedia = await db.query.socialMedias.findFirst({
        where: eq(models.socialMedias.id, entityId),
      });
      if (!socialMedia) throw new ApiError('Social media record not found', 404);
      break;
    }

    case 'tax_credit_icon': {
      const taxCredit = await db.query.tax_credits.findFirst({
        where: and(isNull(models.tax_credits.deletedAt), eq(models.tax_credits.id, entityId)),
      });
      if (!taxCredit) throw new ApiError('Tax credit not found', 404);
      break;
    }

    case 'application_document': {
      // For applications, entityId should be applicationDocumentCategoryId
      const applicationDocumentCategory = await db.query.applicationDocumentCategories.findFirst({
        where: and(
          isNull(models.applicationDocumentCategories.deletedAt),
          eq(models.applicationDocumentCategories.id, entityId)
        ),
        with: {
          application: {
            columns: { id: true, status: true },
            with: {
              applicationStatusHistories: { columns: { status: true } },
            },
          },
        },
      });
      if (!applicationDocumentCategory)
        throw new ApiError('Application document category not found', 404);

      const appStatusHistorySet = new Set(
        applicationDocumentCategory.application.applicationStatusHistories.map((h) => h.status)
      );
      if (appStatusHistorySet.has(applicationStatuses.DOCUMENTS_VERIFIED)) {
        throw new ApiError(
          'Cannot upload application document: application document already verified',
          409
        );
      }
      break;
    }

    case 'tax_return_document': {
      const application = await db.query.applications.findFirst({
        where: and(isNull(models.applications.deletedAt), eq(models.applications.id, entityId)),
        columns: { id: true, status: true },
      });
      if (!application) throw new ApiError('Application not found', 404);
      if (application.status === applicationStatuses.REFUND_COMPLETED) {
        throw new ApiError('Cannot upload: application is already refund completed', 409);
      }
      if (application.status !== applicationStatuses.PROCESSING) {
        throw new ApiError('Tax return document can be uploaded only in processing state', 409);
      }
      break;
    }

    case 'question_category_icon': {
      const category = await db.query.questionCategories.findFirst({
        where: eq(models.questionCategories.id, entityId),
      });
      if (!category) throw new ApiError('Question category not found', 404);
      break;
    }

    default:
      throw new ApiError(`Unsupported upload type: ${uploadType}`, 400);
  }

  return entityId;
};

// const fileFirstUploadTypes = ['carousel_image', 'document_template', 'application_document_direct', 'chat_attachment'];
const entityFirstUploadTypes = [
  'blog_image',
  'social_media_logo',
  'tax_credit_icon',
  'question_category_icon',
  'application_document',
  'tax_return_document',
];

// #region FILE UPLOAD
// Allowed upload types for users
const userAllowedUploadTypes = ['application_document', 'chat_attachment'];
const adminAllowedUploadTypes = [
  'blog_image',
  'social_media_logo',
  'tax_credit_icon',
  'question_category_icon',
  'tax_return_document',
  'chat_attachment',
  'carousel_image',
  'document_template',
  'application_document_direct',
];
// Generate pre-signed URL for file upload with immediate entity association
export const requestPresignedUrl = serviceHandler(requestPresignedUrlSchema, async (req, res) => {
  const { entityId: originalEntityId, type: uploadType, filename, metadata } = req.body;

  const isEntityFirstUpload = entityFirstUploadTypes.includes(uploadType);

  // Restrict upload permissions based on type and user role
  if (req.admin) {
    // Admin can upload all types except those allowed for users
    if (!adminAllowedUploadTypes.includes(uploadType)) {
      throw new ApiError(
        `Admins cannot upload ${uploadType}. Only users can upload this type.`,
        403
      );
    }
  } else if (req.user) {
    // User can only upload types in userAllowedUploadTypes
    if (!userAllowedUploadTypes.includes(uploadType)) {
      throw new ApiError('Only admins can upload this file type.', 403);
    }
  } else {
    throw new ApiError('Unauthorized: No user or admin found', 401);
  }

  if (isEntityFirstUpload) {
    if (!originalEntityId) throw new ApiError('Entity ID is required for this upload type');
    // Validate entity exists or create if needed
    await validateEntityExists(originalEntityId, uploadType);
  }

  // Determine uploader type and ID
  const uploaderType = req.admin ? 'admin' : 'user';
  const uploadedBy = req.admin?.id || req.user?.id || null;

  // Get upload configuration
  const config = uploadTypes[uploadType];

  // Generate unique S3 key
  const key = generateUniqueFileName(filename);
  const mimeType = getMimeTypeFromFilename(filename);

  // Create file record in database
  const [file] = await db
    .insert(models.files)
    .values({
      key,
      hashedKey: hashWithHMAC(key),
      fileName: filename,
      fileType: uploadType,
      mimeType,
      status: 'pending',
      uploadedBy,
      uploaderType,
      uploadedAt: null,
    })
    .returning();

  // Associate file with entity immediately
  if (isEntityFirstUpload) {
    await associateFileWithEntity(file.id, originalEntityId as string, uploadType, uploadedBy!);
  } else {
    await fileFirstAssociations(file.id, uploadType, metadata);
  }

  // Generate pre-signed URL
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: mimeType,
  });

  try {
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: config.expirationMinutes * 60,
    });

    return res.success('Pre-signed URL generated successfully', {
      id: file.id,
      fileType: file.fileType,
      key,
      presignedUrl,
      expiresIn: config.expirationMinutes * 60,
      maxFileSize: config.maxFileSize,
      allowedMimeTypes: config.allowedMimeTypes,
    });
  } catch (error) {
    logger.error('Error generating pre-signed URL:', error);
    throw new ApiError('Failed to generate upload URL', 500);
  }
});

// Confirm file uploads using S3 keys and update file metadata
export const confirmFileUpload = serviceHandler(confirmFileUploadSchema, async (req, res) => {
  const { keys } = req.body;

  const confirmationResults = await Promise.all(
    keys.map(async (key) => {
      try {
        const haskedKey = hashWithHMAC(key);
        // Find the file record by key
        const file = await db.query.files.findFirst({
          where: and(eq(models.files.hashedKey, haskedKey), eq(models.files.status, 'pending')),
        });

        if (!file) {
          // Even if the DB record isn't found, try to provide a presigned URL for debugging/clients
          let filePath: string | undefined;
          try {
            filePath = await getPresignedGetObjectUrl(key);
          } catch {
            // ignore presign errors for not_found response
          }
          return { key, status: 'not_found', error: 'File record not found', filePath };
        }

        // Verify file exists in S3 and get metadata
        const headCommand = new HeadObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: key,
        });

        const s3Response = await s3Client.send(headCommand);

        // Update file record with S3 metadata and mark as active
        await db
          .update(models.files)
          .set({
            fileSize: s3Response.ContentLength?.toString() || '0',
            mimeType: s3Response.ContentType || file.mimeType,
            uploadedAt: s3Response.LastModified?.toISOString() || new Date().toISOString(),
            status: 'active',
            updatedAt: new Date(),
          })
          .where(eq(models.files.id, file.id));

        // Generate a presigned URL to return to the client
        let filePath: string | undefined;
        try {
          filePath = await getPresignedGetObjectUrl(key);
        } catch {
          // ignore presign errors when returning active response
        }

        return {
          key,
          status: 'active',
          fileId: file.id,
          size: s3Response.ContentLength,
          mimeType: s3Response.ContentType,
          filePath,
        };
      } catch (error) {
        // Mark file as failed if S3 verification fails
        const file = await db.query.files.findFirst({
          where: eq(models.files.key, key),
        });

        if (file) {
          await db
            .update(models.files)
            .set({
              status: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(models.files.id, file.id));
        }

        logger.error(`Error verifying file ${key}:`, error);
        let filePath: string | undefined;
        try {
          filePath = await getPresignedGetObjectUrl(key);
        } catch {
          // ignore presign errors when returning failed response
        }
        return {
          key,
          status: 'failed',
          error: 'File not found in storage or verification failed',
          filePath,
        };
      }
    })
  );

  const successCount = confirmationResults.filter((r) => r.status === 'active').length;
  const failedCount = confirmationResults.filter((r) => r.status === 'failed').length;

  return res.success(
    `File upload confirmation completed. ${successCount} successful, ${failedCount} failed.`,
    {
      results: confirmationResults,
      summary: { total: keys.length, successful: successCount, failed: failedCount },
    }
  );
});

// Get file metadata by ID
export const getFile = serviceHandler(getFileSchema, async (req, res) => {
  const { id } = req.params;

  const file = await db.query.files.findFirst({
    where: eq(models.files.id, id),
  });

  if (!file) {
    throw new ApiError('File not found', 404);
  }

  return res.success('File retrieved successfully', file);
});

// Soft delete file
export const deleteFile = serviceHandler(deleteFileSchema, async (req, res) => {
  const { id } = req.params;

  const file = await db.query.files.findFirst({
    where: and(eq(models.files.id, id), eq(models.files.status, 'active')),
  });

  if (!file) {
    throw new ApiError('File not found or already deleted', 404);
  }

  // Soft delete the file
  await db
    .update(models.files)
    .set({
      status: 'deleted',
      updatedAt: new Date(),
    })
    .where(eq(models.files.id, id));

  return res.success('File deleted successfully');
});

// List files with pagination
export const listFiles = serviceHandler(z.object({}), async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const files = await db.query.files.findMany({
    where: eq(models.files.status, 'active'),
    orderBy: desc(models.files.createdAt),
    limit,
    offset,
  });

  const totalCount = await db.$count(models.files, eq(models.files.status, 'active'));

  return res.data('Files retrieved successfully', files, {
    page,
    size,
    total: totalCount,
  });
});

// Cleanup orphaned files (cron job function)
export const cleanupOrphanedFiles = serviceHandler(z.object({}), async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  // Find orphaned files (pending for more than 1 hour)
  const orphanedFiles = await db.query.files.findMany({
    where: and(eq(models.files.status, 'pending'), lt(models.files.createdAt, oneHourAgo)),
  });

  if (orphanedFiles.length === 0) {
    return res.success('No orphaned files found', { cleaned: 0 });
  }

  let cleanedCount = 0;

  // Process each orphaned file
  for (const file of orphanedFiles) {
    try {
      // Try to delete from S3 (may not exist)
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: file.key,
      });

      try {
        await s3Client.send(headCommand);
        // File exists in S3, so we might want to keep it or delete it
        // For this implementation, we'll mark it as failed instead of deleting
        await db
          .update(models.files)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(models.files.id, file.id));
      } catch {
        // File doesn't exist in S3, safe to mark as failed
        await db
          .update(models.files)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(models.files.id, file.id));
      }

      cleanedCount++;
    } catch (error) {
      logger.error(`Error cleaning up orphaned file ${file.id}:`, error);
    }
  }

  logger.info(`Cleaned up ${cleanedCount} orphaned files`);

  return res.success(`Cleanup completed. ${cleanedCount} orphaned files processed.`, {
    cleaned: cleanedCount,
    total: orphanedFiles.length,
  });
});
export const deleteFileWithAssociation = serviceHandler(
  deleteFileWithAssociationSchema,
  async (req, res) => {
    const { fileId: originalFileId, type: uploadType } = req.body;

    const isEntityFirstUpload = entityFirstUploadTypes.includes(uploadType);

    // Restrict upload permissions based on type and user role
    if (req.admin) {
      // Admin can upload all types except those allowed for users
      if (!adminAllowedUploadTypes.includes(uploadType)) {
        throw new ApiError(
          `Admins cannot delete ${uploadType}. Only users can delete this type.`,
          403
        );
      }
    } else if (req.user) {
      // User can only upload types in userAllowedUploadTypes
      if (!userAllowedUploadTypes.includes(uploadType)) {
        throw new ApiError('Only admins can delete this file type.', 403);
      }
    } else {
      throw new ApiError('Unauthorized: No user or admin found', 401);
    }
    // Associate file with entity immediately
    if (isEntityFirstUpload) {
      await disAssociateFileWithEntity(originalFileId, uploadType);
    } else {
      await fileFirstDisAssociations(originalFileId, uploadType);
    }
    await deleteFileFromS3AndDB(originalFileId);
    return res.success('File and associations deleted successfully');
  }
);
