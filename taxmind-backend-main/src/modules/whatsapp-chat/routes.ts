import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';

import {
  downloadMedia,
  handleWebhookEvent,
  listConversations,
  listMessages,
  markRead,
  sendMessage,
  verifyWebhook,
} from './services';

const router = Router();

router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhookEvent);
router.get(
  '/conversations',
  authorize('ADMIN'),
  //   requirePermission(MODULE_CONFIGS.customerSupport.name, 'view'),
  paginate,
  listConversations
);
// List messages
router.get(
  '/messages',
  authorize('ADMIN'),
  //   requireAnyPermission([
  //     [MODULE_CONFIGS.applications.name, 'view'],
  //     [MODULE_CONFIGS.customerSupport.name, 'view'],
  //   ]),
  paginate,
  listMessages
);

// Mark read
router.post(
  '/read',
  authorize('ADMIN'),
  //   requireAnyPermission([
  //     [MODULE_CONFIGS.applications.name, 'view'],
  //     [MODULE_CONFIGS.customerSupport.name, 'view'],
  //   ]),
  markRead
);

router.post(
  '/send',
  authorize('ADMIN'),

  //   requireAnyPermission([
  //     [MODULE_CONFIGS.applications.name, 'view'],
  //     [MODULE_CONFIGS.customerSupport.name, 'view'],
  //   ]),
  sendMessage
);

router.post(
  '/download-media',
  authorize('ADMIN'),

  //   requireAnyPermission([
  //     [MODULE_CONFIGS.applications.name, 'view'],
  //     [MODULE_CONFIGS.customerSupport.name, 'view'],
  //   ]),
  downloadMedia
);

export default router;
