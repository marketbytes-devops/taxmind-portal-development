import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';

import {
  changePassword,
  deleteAccount,
  emailVerificationCode,
  esignatureWebhook,
  getAccessToken,
  getProfile,
  getQuery,
  getUserDetails,
  listAgentActivations,
  listOffBoardedUsers,
  listQueries,
  listUsers,
  offboardUser,
  pairUser,
  phoneVerificationCode,
  reactivateAccount,
  resetPassword,
  signIn,
  signOut,
  signUp,
  searchProfessions,
  submitQuery,
  toggleAgentActivationRequestStatus,
  unbindSpouse,
  unpairUser,
  updateProfile,
  updateUserActivationStatus,
  updateUserRemark,
  uploadAgentActivationData,
  verifyEmail,
  verifyPhone,
} from './services';

const router = Router();

router.post('/auth/signin', signIn);
router.post('/auth/signup', signUp);
router.post('/auth/reactivate', reactivateAccount);
router.post('/auth/signout', authorize('USER'), signOut);
router.post('/auth/token/refresh', getAccessToken);
router.post('/auth/password/change', authorize('USER'), changePassword);
router.post('/auth/password/reset', resetPassword);
router.post('/auth/email/verify', emailVerificationCode);
router.post('/auth/email/verify/confirm', verifyEmail);
router.post('/auth/phone/verify', phoneVerificationCode);
router.post('/auth/phone/verify/confirm', verifyPhone);
router.get('/profile', authorize('USER'), getProfile);
router.patch('/profile', authorize('USER'), updateProfile);

router.get('/', authorize('ADMIN'), paginate, listUsers);
router.get('/professions/search', authorize('ADMIN'), searchProfessions);
router.post('/auth/spouse/unbind', authorize('USER'), unbindSpouse);
router.delete('/auth/delete-account', authorize('USER'), deleteAccount);
router.delete('/:userId/offboard', authorize('ADMIN'), offboardUser);
router.patch('/:userId/activation-status', authorize('ADMIN'), updateUserActivationStatus);
router.patch('/:userId/remark', authorize('ADMIN'), updateUserRemark);
router.post('/pair', authorize('ADMIN'), pairUser);
router.post('/:userId/unpair', authorize('ADMIN'), unpairUser);

// Admin-only: upload agent activation records
router.post(
  '/agent-activations/upload',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.agentActivation.name, 'edit'),
  uploadAgentActivationData
);

//Admin-only: endpoint to mark users where admin requested their agent activation in ROS
router.post(
  '/agent-activations/requested',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.agentActivation.name, 'view'),
  toggleAgentActivationRequestStatus
);
router.get(
  '/agent-activations',
  authorize('ADMIN'),
  paginate,
  requirePermission(MODULE_CONFIGS.agentActivation.name, 'view'),
  listAgentActivations
);
router.post('/esign/webhook', esignatureWebhook);

// Public endpoint: submit a general query/contact message
router.post('/queries', submitQuery);

// =====================
// User Queries Routes (Read Only for Admins)
// =====================
router.get(
  '/queries',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.contactUs.name, 'view'),
  paginate,
  listQueries
);
router.get(
  '/queries/:id',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.contactUs.name, 'view'),
  getQuery
);
router.get('/off-boarded', authorize('ADMIN'), paginate, listOffBoardedUsers);
router.get(
  '/:userId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.users.name, 'view'),
  getUserDetails
);
// router.post('/profile/upload-photo', authorize('USER'), uploadProfilePhoto);
// router.post('/fcm/subscribe', authorize('USER'), subscribeToFcmTopic);
// router.post('/fcm/unsubscribe', authorize('USER'), unsubscribeFromFcmTopic);

export default router;
