import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requireAnyPermission, requirePermission } from '@/middleware/rbac';

import {
  listAdminApplicationConversations,
  listAdminSupportConversations,
  listMessages,
  markRead,
} from './services';

const router = Router();

router.get(
  '/admins/support-conversations',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.customerSupport.name, 'view'),
  paginate,
  listAdminSupportConversations
);

router.get(
  '/admins/application-conversations',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.applications.name, 'view'),
  paginate,
  listAdminApplicationConversations
);

// List messages
router.get(
  '/messages',
  authorize('ADMIN', 'USER'),
  requireAnyPermission([
    [MODULE_CONFIGS.applications.name, 'view'],
    [MODULE_CONFIGS.customerSupport.name, 'view'],
  ]),
  paginate,
  listMessages
);

// Mark read
router.post(
  '/read',
  authorize('ADMIN', 'USER'),
  requireAnyPermission([
    [MODULE_CONFIGS.applications.name, 'view'],
    [MODULE_CONFIGS.customerSupport.name, 'view'],
  ]),
  markRead
);

export default router;
