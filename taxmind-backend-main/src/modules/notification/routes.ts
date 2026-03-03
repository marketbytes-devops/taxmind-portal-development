import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';

import {
  listAdminSendNotifications,
  listUserNotifications,
  markNotificationAsSeen,
  removeUserFcmToken,
  sendNotification,
  updateUserFcmToken,
  listAdminNotifications,
  updateAdminFcmToken,
  removeAdminFcmToken,
  markAdminNotificationAsSeen,
} from './services';

const router = Router();

router.post('/send', authorize('ADMIN'), sendNotification);
router.get('/admin-created', authorize('ADMIN'), paginate, listAdminSendNotifications);
router.get('/user', authorize('USER'), paginate, listUserNotifications);
router.post('/user/seen', authorize('USER'), markNotificationAsSeen);
router.patch('/user/fcm-token', authorize('USER'), updateUserFcmToken);
router.delete('/user/fcm-token', authorize('USER'), removeUserFcmToken);

router.get('/admin', authorize('ADMIN'), paginate, listAdminNotifications);
router.post('/admin/seen', authorize('ADMIN'), markAdminNotificationAsSeen);
router.patch('/admin/fcm-token', authorize('ADMIN'), updateAdminFcmToken);
router.delete('/admin/fcm-token', authorize('ADMIN'), removeAdminFcmToken);

export default router;
