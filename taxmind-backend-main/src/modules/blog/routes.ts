import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';

import { createBlog, deleteBlog, getBlog, listBlogs, publishBlog, updateBlog } from './services';

const router = Router();

// =======================
// Admin Routes (Protected)
// =======================

// List all blogs
router.get(
  '/',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'view'),
  paginate,
  listBlogs
);

// Get single blog (admin or public access)
router.get(
  '/:identifier',
  authorize('ADMIN', 'USER', 'PUBLIC'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'view'),
  getBlog
);

// Create new blog (admin only)
router.post(
  '/',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'create'),
  createBlog
);

// Update blog (admin only)
router.put(
  '/:blogId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'edit'),
  updateBlog
);

// Publish blog (admin only)
router.patch(
  '/:blogId/publish',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'edit'),
  publishBlog
);

// Delete blog (admin only)
router.delete(
  '/:blogId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.blogs.name, 'delete'),
  deleteBlog
);

export default router;
