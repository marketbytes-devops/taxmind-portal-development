import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';

import {
  cleanupOrphanedFiles,
  confirmFileUpload,
  deleteFileWithAssociation,
  getFile,
  listFiles,
  requestPresignedUrl,
} from './services';

const router = Router();

// =====================
// File Upload Routes
// =====================

// Request pre-signed URL for file upload (authenticated users only)
router.post('/request-upload', authorize('ADMIN', 'USER'), requestPresignedUrl);

// Confirm file upload after S3 upload (authenticated users only)
router.post('/confirm-upload', authorize('ADMIN', 'USER'), confirmFileUpload);

// Get file metadata by ID (public)
router.get('/:id', getFile);

// =====================
// Admin File Management Routes
// =====================

// List all files with filtering and pagination (admin only)
router.get('/', authorize('ADMIN'), paginate, listFiles);

// Delete file (admin only)
router.delete('/', authorize('ADMIN', 'USER'), deleteFileWithAssociation);

// Cleanup orphaned files (admin only - for manual trigger or cron)
router.post(
  '/cleanup',
  authorize('ADMIN'),

  cleanupOrphanedFiles
);

export default router;
