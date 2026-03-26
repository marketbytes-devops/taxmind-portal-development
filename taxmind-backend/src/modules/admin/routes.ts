import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';

import {
  adminLookup,
  changePassword,
  getAdminDashboard,
  getAdminProfile,
  listAdminUsers,
  listReports,
  refreshToken,
  registerNewUser,
  resetPassword,
  sendEmailVerificationCode,
  signIn,
  signOut,
  updateAdminProfile,
  verifyEmailOtp,
} from './services';

const router = Router();

router.post(
  '/',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'create'),
  registerNewUser
);
router.get(
  '/',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'),
  paginate,
  listAdminUsers
);
router.post('/auth/signin', signIn);
router.post('/auth/signout', authorize('ADMIN'), signOut);
router.post('/auth/token/refresh', refreshToken);
router.post('/auth/password/change', authorize('ADMIN'), changePassword);
router.post('/auth/password/reset', resetPassword);
router.post('/auth/email/verify', sendEmailVerificationCode);
router.post('/auth/email/verify/confirm', verifyEmailOtp);
router.get('/profile', authorize('ADMIN'), getAdminProfile);
router.put(
  '/:adminId/profile',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'edit'),
  updateAdminProfile
);
router.get('/lookup', authorize('ADMIN'), adminLookup);
router.get(
  '/dashboard',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.dashboard.name, 'view'),
  getAdminDashboard
);
//
router.get(
  '/reports',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.users.name, 'view'),
  paginate,
  listReports
);

export default router;
