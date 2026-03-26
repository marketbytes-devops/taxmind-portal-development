// 🔐 RBAC Quick Reference - Methods & Use Cases

// ═══════════════════════════════════════════════════════════
// 📋 MIDDLEWARE FUNCTIONS (Route Protection)
// ═══════════════════════════════════════════════════════════

import { 
  requirePermission, 
  requireAllPermissions, 
  requireAnyPermission, 
  requireModuleAccess 
} from '@/middleware/rbac';

// 1. Single Permission Check
router.get('/users', 
  authorize('ADMIN', 'USER'),
  requirePermission('users', 'view'),  // Must have users:view
  getUsersController
);

// 2. Multiple Required Permissions (AND logic)
router.post('/users/bulk-import', 
  authorize('ADMIN'),
  requireAllPermissions([              // Must have ALL of these
    ['users', 'create'],
    ['users', 'import']
  ]),
  bulkImportController
);

// 3. Alternative Permissions (OR logic)  
router.get('/dashboard', 
  authorize('USER', 'ADMIN'),
  requireAnyPermission([               // Must have ANY of these
    ['dashboard', 'view'],
    ['users', 'view'],
    ['applications', 'view']
  ]),
  dashboardController
);

// 4. Module-Level Access
router.use('/api/users/*', 
  authorize('ADMIN'),
  requireModuleAccess('users'),        // Any permission in 'users' module
  userRoutes
);

// ═══════════════════════════════════════════════════════════
// 🔍 PERMISSION CHECKING FUNCTIONS (Programmatic)
// ═══════════════════════════════════════════════════════════

import { 
  checkUserPermission, 
  getUserPermissions, 
  getUserPermissionsByModule 
} from '@/modules/rbac/services';

// 1. Check Single Permission
const canEdit = await checkUserPermission(userId, 'users', 'edit');
if (canEdit) {
  // Allow editing
}

// 2. Get All User Permissions (Flat Array)
const permissions = await getUserPermissions(userId);
// Returns: ["users:view", "users:edit", "dashboard:view"]

// 3. Get Permissions Grouped by Module
const { permissions, modulePermissions } = await getUserPermissionsByModule(userId);
// Returns: {
//   permissions: ["users:view", "users:edit"],
//   modulePermissions: {
//     "users": ["view", "edit"],
//     "dashboard": ["view"]
//   }
// }

// ═══════════════════════════════════════════════════════════
// 🛠️ ADMINISTRATIVE FUNCTIONS
// ═══════════════════════════════════════════════════════════

import { 
  initializeModulesAndPermissions,
  assignPermissionsToRole,
  getRolePermissions 
} from '@/modules/rbac/services';

// 1. Initialize System (Run once during setup)
await initializeModulesAndPermissions();

// 2. Assign Permissions to Role
await assignPermissionsToRole(roleId, [permissionId1, permissionId2]);

// 3. Get Role's Permissions
const rolePerms = await getRolePermissions(roleId);

// ═══════════════════════════════════════════════════════════
// 📊 AVAILABLE MODULES & PERMISSIONS
// ═══════════════════════════════════════════════════════════

const MODULES = {
  users: ['create', 'view', 'edit', 'delete', 'export'],
  applications: ['view', 'edit', 'delete', 'approve', 'reject', 'export'],
  dashboard: ['view'],
  categories: ['create', 'view', 'edit', 'delete'],
  questionnaires: ['create', 'view', 'edit', 'delete'],
  reports: ['view', 'export'],
};

// ═══════════════════════════════════════════════════════════
// 💡 COMMON USE CASES & EXAMPLES
// ═══════════════════════════════════════════════════════════

// USE CASE 1: Resource Owner or Admin Access
export const updateUserProfile = serviceHandler(schema, async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;
  
  // Users can edit their own profile OR admin can edit any profile
  const canEditOthers = await checkUserPermission(requestingUserId, 'users', 'edit');
  
  if (userId !== requestingUserId && !canEditOthers) {
    throw new ApiError('Access denied', 403);
  }
  
  // Proceed with update...
});

// USE CASE 2: Conditional UI/Features Based on Permissions
export const getUserDashboardData = serviceHandler(schema, async (req, res) => {
  const userId = req.user.id;
  const { modulePermissions } = await getUserPermissionsByModule(userId);
  
  const dashboardData = {
    basicInfo: await getBasicInfo(),
  };
  
  // Add sections based on permissions
  if (modulePermissions.users?.includes('view')) {
    dashboardData.userStats = await getUserStats();
  }
  
  if (modulePermissions.applications?.includes('view')) {
    dashboardData.applicationStats = await getApplicationStats();
  }
  
  return res.success('Dashboard data', dashboardData);
});

// USE CASE 3: Multi-Step Process with Different Permission Requirements
router.post('/applications/:id/process', 
  authorize('ADMIN'),
  async (req, res, next) => {
    const { action } = req.body;
    
    // Different actions require different permissions
    const requiredPermissions = {
      'review': ['applications', 'view'],
      'approve': ['applications', 'approve'], 
      'reject': ['applications', 'reject'],
      'delete': ['applications', 'delete']
    };
    
    const [module, permission] = requiredPermissions[action];
    const hasPermission = await checkUserPermission(req.user.id, module, permission);
    
    if (!hasPermission) {
      throw new ApiError(`Access denied for action: ${action}`, 403);
    }
    
    next();
  },
  processApplicationController
);

// USE CASE 4: Bulk Operations with Multiple Permission Checks
export const bulkUserOperations = serviceHandler(schema, async (req, res) => {
  const { operations } = req.body; // [{ type: 'delete', userId: '...' }, ...]
  const requestingUserId = req.user.id;
  
  // Check permissions for each operation type
  const permissionChecks = {
    'delete': checkUserPermission(requestingUserId, 'users', 'delete'),
    'edit': checkUserPermission(requestingUserId, 'users', 'edit'),
    'export': checkUserPermission(requestingUserId, 'users', 'export'),
  };
  
  const permissions = await Promise.all(Object.values(permissionChecks));
  const permissionMap = Object.fromEntries(
    Object.keys(permissionChecks).map((key, index) => [key, permissions[index]])
  );
  
  // Filter operations based on permissions
  const allowedOperations = operations.filter(op => permissionMap[op.type]);
  
  // Process allowed operations...
  return res.success('Bulk operations completed', { 
    processed: allowedOperations.length,
    skipped: operations.length - allowedOperations.length 
  });
});

// ═══════════════════════════════════════════════════════════
// 🚨 IMPORTANT NOTES
// ═══════════════════════════════════════════════════════════

/*
1. ALWAYS use authorize() middleware before RBAC middleware
2. Permission format: "module:permission" (e.g., "users:edit")
3. Middleware throws 403 errors automatically with descriptive messages
4. Permission checks are case-sensitive
5. Users have exactly ONE role (simplified from multi-role system)
6. Roles can have multiple module permissions
7. Database queries are optimized with proper indexing
8. Consider caching permissions for high-frequency operations
*/
