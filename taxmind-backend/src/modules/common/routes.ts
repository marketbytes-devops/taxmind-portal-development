import { Router } from 'express';

import { authorize } from '@/middleware/authorize';

import { testFn } from './services';

const router = Router();

router.get('/test', authorize('ADMIN', 'USER', 'PUBLIC'), testFn);

export default router;
