import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { requireModuleAccess } from '@/middleware/rbac';

import adminRouter from './admin/routes';
import applicationsRouter from './applications/routes';
import blogRouter from './blog/routes';
import chatRouter from './chat/routes';
import commonRouter from './common/routes';
import filesRouter from './files/routes';
import notificationRouter from './notification/routes';
import questionnaireRouter from './questionnaire/routes';
import rbacRouter from './rbac/routes';
import siteContentRouter from './site-content/routes';
import userRouter from './user/routes';
import whatsappChatRouter from './whatsapp-chat/routes';

const router = Router();

router.use('/v1/users', userRouter);
router.use('/v1/admins', adminRouter);
router.use('/v1/blogs', blogRouter);
router.use('/v1/files', filesRouter);
router.use('/v1/applications', applicationsRouter);
router.use('/v1/rbac', authorize('ADMIN'), requireModuleAccess('users'), rbacRouter);
router.use('/v1/notifications', notificationRouter); // Notifications should be accessible to all authenticated users
router.use('/v1/chats', chatRouter); // Chat routes
router.use('/v1/site-contents', siteContentRouter); // Public site content, no module restriction needed
router.use('/v1/questionnaires', questionnaireRouter);
router.use('/v1/whatsapp-chats', whatsappChatRouter);
router.use('/v1', commonRouter); // Common routes should be accessible

export default router;
