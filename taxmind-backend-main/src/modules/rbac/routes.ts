import { Router } from 'express';

import { MODULE_CONFIGS } from '@/constants/modulePermissions';
import { authorize } from '@/middleware/authorize';
import { paginate } from '@/middleware/paginate';
import { requirePermission } from '@/middleware/rbac';
import { sort } from '@/middleware/sort';

import {
  // Permission assignment
  assignPermissionsToRole,
  createRole,
  deleteRole,
  // Module and permission management
  getAllModulesWithPermissions,
  getAllRoles,
  getRoleDetails,
  getRolePermissions,
  // Role management
  getRoles,
  initializeModulesAndPermissions,
  updateRole,
} from './services';

const router = Router();

// ═══════════════════════════════════════════════════════════
// MODULE MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════

// Get all modules with their permissions (for role configuration UI)
router.get(
  '/modules',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'), // Basic permission to view RBAC data
  getAllModulesWithPermissions
);

// Initialize modules and permissions (admin only, typically used in setup)
router.post(
  '/modules/initialize',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'create'), // High-level permission for system setup
  async (req, res) => {
    await initializeModulesAndPermissions();
    return res.success('Modules and permissions initialized successfully');
  }
);

// ═══════════════════════════════════════════════════════════
// ROLE MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════

// Get all roles with pagination and search
router.get(
  '/roles',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'),
  paginate,
  sort,
  getRoles
);
// Get all roles with out pagination and search
router.get(
  '/list-all-roles',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'),
  getAllRoles
);

// Create a new role
router.post(
  '/roles',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'create'),
  createRole
);

// Get specific role details
router.get(
  '/roles/:roleId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'),
  getRoleDetails
);

// Update role details and permissions
router.put(
  '/roles/:roleId',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'edit'),
  updateRole
);

// Delete a role
router.delete(
  '/roles/:roleId',
  authorize('ADMIN'),
  // requirePermission(MODULE_CONFIGS.rbac.name, 'delete'),
  deleteRole
);

// ═══════════════════════════════════════════════════════════
// PERMISSION ASSIGNMENT ROUTES
// ═══════════════════════════════════════════════════════════

// Assign permissions to a role (alternative endpoint for fine-grained control)
router.post(
  '/roles/:roleId/permissions',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'edit'),
  assignPermissionsToRole
);

// Get role permissions (detailed view with module grouping)
router.get(
  '/roles/:roleId/permissions',
  authorize('ADMIN'),
  requirePermission(MODULE_CONFIGS.rbac.name, 'view'),
  getRolePermissions
);

export default router;
