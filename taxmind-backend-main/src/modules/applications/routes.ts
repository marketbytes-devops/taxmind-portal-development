import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';

// import { revolutIpAllowlist } from '@/middleware/revolutIpAllowlist';

import {
  adminGetApplicationDocuments,
  adminListApplications,
  applicationListOfUser,
  approveOfflinePaymentRequest,
  calculateApplicationAmounts,
  checkDocumentsUploadedStatus,
  claimHistory,
  createApplicationNote,
  createApplicationReview,
  createDocumentRequest,
  createOfflinePaymentRequest,
  createPaymentCheckout,
  downloadApplicationData,
  getApplicationDetails,
  getApplicationReview,
  getApplicationStep,
  listApplicationNotes,
  listApplicationReviews,
  listApplications,
  listCompletedPayments,
  listPendingOfflinePaymentRequests,
  listRejectedOfflinePaymentRequests,
  paymentWebhook,
  rejectOfflinePaymentRequest,
  setDocumentsVerifiedStatus,
  setReviewedStatus,
  startApplication,
  submitApplicationAmounts,
  updateApplicationReviewStatus,
  updateDocumentRequestStatus,
} from './services';

const router = Router();

router.post('/start', authorize('USER'), startApplication);

router.get(
  '/',
  authorize('USER'),
  // requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  listApplications
);
// User: get claim history for current user
router.get(
  '/claims',
  authorize('USER'),
  // requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  claimHistory
);
// Admin: list applications (with filters)
router.get(
  '/all',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  adminListApplications
);

// Admin: list applications of a user
router.get(
  '/user',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  applicationListOfUser
);

router.get(
  '/:applicationId/download',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  downloadApplicationData
);

router.get(
  '/:applicationId/documents',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  adminGetApplicationDocuments
);

router.get(
  '/:applicationId/steps/:key',
  authorize('USER'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  getApplicationStep
);

// Admin notes on applications
router.post(
  '/notes',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  createApplicationNote
);

router.get(
  '/:applicationId/notes',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  listApplicationNotes
);

// Admin: create new document request for an application
router.post(
  '/documents/request',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  createDocumentRequest
);

// Admin: update document request status (accept/reject/withdraw)
router.patch(
  '/documents/:applicationDocumentCategoryId/status',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  updateDocumentRequestStatus
);

// Admin: set application status to documents_uploaded
router.patch(
  '/:applicationId/status/documents_uploaded',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  setDocumentsVerifiedStatus
);

// User: check all required documents for a application is uploaded
router.post(
  '/:applicationId/check/documents_uploaded',
  authorize('ADMIN', 'USER'),
  // requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  checkDocumentsUploadedStatus
);

// Admin: set application status to reviewed
router.patch(
  '/:applicationId/status/reviewed',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  setReviewedStatus
);

// Admin: calculate and submit application amounts
router.post(
  '/amounts/calculate',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  calculateApplicationAmounts
);

router.post(
  '/amounts/submit',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'edit'),
  submitApplicationAmounts
);

// Users: submit offline payment completion request (moved here)
router.post('/payments/offline/request', authorize('USER'), createOfflinePaymentRequest);

// Admin: approve/reject offline payment requests
router.post(
  '/payments/offline/request/approve',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.payments.name, 'edit'),
  approveOfflinePaymentRequest
);

router.post(
  '/payments/offline/request/reject',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.payments.name, 'edit'),
  rejectOfflinePaymentRequest
);

router.post('/payments/checkout', authorize('USER'), createPaymentCheckout);

router.post(
  '/payments/webhook',
  // revolutIpAllowlist,
  paymentWebhook
);

router.get(
  '/payments/completed',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.payments.name, 'view'),
  paginate,
  listCompletedPayments
);

router.get(
  '/payments/offline/request/pending',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.payments.name, 'view'),
  paginate,
  listPendingOfflinePaymentRequests
);
router.get(
  '/payments/offline/request/rejected',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.payments.name, 'view'),
  paginate,
  listRejectedOfflinePaymentRequests
);

// =======================
// Application Reviews
// =======================
// User: submit a review for an application
router.post('/reviews', authorize('USER'), createApplicationReview);

// Admin: list reviews
router.get(
  '/reviews',
  authorize('ADMIN', 'USER'),
  requirePermission(MODULE_CONFIGS.reviews.name, 'view'),
  paginate,
  listApplicationReviews
);

// Admin: get single review
router.get(
  '/reviews/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.reviews.name, 'view'),
  getApplicationReview
);

// Admin: update review status
router.patch(
  '/reviews/:id/status',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.reviews.name, 'edit'),
  updateApplicationReviewStatus
);
// Admin: get a specific application by id
router.get(
  '/:applicationId',
  authorize('ADMIN', 'USER'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  getApplicationDetails
);
export default router;
