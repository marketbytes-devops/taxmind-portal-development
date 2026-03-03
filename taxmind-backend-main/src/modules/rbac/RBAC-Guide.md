# 🔐 RBAC System - Complete Guide

## 📊 Database Schema Overview

```
┌─────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│    users    │    │       roles         │    │      modules         │
├─────────────┤    ├─────────────────────┤    ├──────────────────────┤
│ id (PK)     │    │ id (PK)             │    │ id (PK)              │
│ name        │◄──┐│ roleName            │    │ name                 │
│ email       │   ││ createdAt           │    │ displayName          │
│ roleId (FK) │───┘│ updatedAt           │    │ description          │
│ ...         │    └─────────────────────┘    │ isActive             │
└─────────────┘                               │ createdAt            │
                                              │ updatedAt            │
                                              └──────────────────────┘
                            │                              │
                            │                              │
                            ▼                              ▼
           ┌─────────────────────────────┐    ┌─────────────────────────┐
           │  role_module_permissions    │    │   module_permissions    │
           ├─────────────────────────────┤    ├─────────────────────────┤
           │ id (PK)                     │    │ id (PK)                 │
           │ roleId (FK)                 │◄──┐│ moduleId (FK)           │
           │ modulePermissionId (FK)     │───┘│ permissionName          │
           │ isEnabled                   │    │ displayName             │
           │ createdAt                   │    │ description             │
           │ updatedAt                   │    │ isActive                │
           └─────────────────────────────┘    │ createdAt               │
                                              │ updatedAt               │
                                              └─────────────────────────┘
```

### Key Tables:

1. **`users`** - User accounts with single role assignment
2. **`roles`** - Role definitions (Super Admin, Admin, User)
3. **`modules`** - System modules (users, applications, dashboard)
4. **`module_permissions`** - Available permissions per module (create, view, edit, delete)
5. **`role_module_permissions`** - Junction table connecting roles to specific permissions

## 🛠️ Available Methods

### 1. Permission Checking Functions

#### `checkUserPermission(userId, moduleName, permissionName)`

- **Purpose**: Check if a user has a specific permission
- **Returns**: `Promise<boolean>`
- **Use Case**: Programmatic permission checking in services

```typescript
const canEditUsers = await checkUserPermission(userId, 'users', 'edit');
if (canEditUsers) {
  // Allow user to edit
}
```

#### `getUserPermissions(userId)`

- **Purpose**: Get all permissions for a user as flat array
- **Returns**: `Promise<string[]>` (format: "module:permission")
- **Use Case**: Display user's capabilities, frontend permission checks

```typescript
const permissions = await getUserPermissions(userId);
// Returns: ["users:view", "users:edit", "dashboard:view"]
```

#### `getUserPermissionsByModule(userId)`

- **Purpose**: Get user permissions grouped by module
- **Returns**: `Promise<{permissions: string[], modulePermissions: Record<string, string[]>}>`
- **Use Case**: Building permission-based UI components

```typescript
const { permissions, modulePermissions } = await getUserPermissionsByModule(userId);
// modulePermissions: { "users": ["view", "edit"], "dashboard": ["view"] }
```

### 2. RBAC Middleware Functions

#### `requirePermission(moduleName, permissionName)`

- **Purpose**: Protect single route with specific permission
- **Use Case**: Most common - protect specific actions

```typescript
import { requirePermission } from '@/middleware/rbac';

router.get(
  '/users',
  authorize('USER', 'ADMIN'), // Authentication first
  requirePermission('users', 'view'), // Then permission check
  listUsersController
);

router.post(
  '/users',
  authorize('ADMIN'),
  requirePermission('users', 'create'),
  createUserController
);

router.put(
  '/users/:id',
  authorize('ADMIN'),
  requirePermission('users', 'edit'),
  updateUserController
);

router.delete(
  '/users/:id',
  authorize('ADMIN'),
  requirePermission('users', 'delete'),
  deleteUserController
);
```

#### `requireAllPermissions(permissions[])`

- **Purpose**: User must have ALL specified permissions
- **Use Case**: Complex operations requiring multiple permissions

```typescript
router.post(
  '/users/bulk-import',
  authorize('ADMIN'),
  requireAllPermissions([
    ['users', 'create'],
    ['users', 'import'],
  ]),
  bulkImportUsersController
);
```

#### `requireAnyPermission(permissions[])`

- **Purpose**: User needs ANY ONE of the specified permissions
- **Use Case**: Alternative access paths, flexible permissions

```typescript
router.get(
  '/admin-dashboard',
  authorize('ADMIN', 'USER'),
  requireAnyPermission([
    ['dashboard', 'view'],
    ['users', 'view'],
    ['applications', 'view'],
  ]),
  adminDashboardController
);
```

#### `requireModuleAccess(moduleName)`

- **Purpose**: User needs any permission within a module
- **Use Case**: Module-level access control

```typescript
router.use(
  '/api/users/*',
  authorize('ADMIN', 'USER'),
  requireModuleAccess('users'), // Any permission in users module
  userRoutesHandler
);
```

### 3. Administrative Functions

#### `initializeModulesAndPermissions()`

- **Purpose**: Initialize modules and permissions from config
- **Use Case**: System setup, migrations

#### `assignPermissionsToRole(roleId, permissionIds[])`

- **Purpose**: Assign specific permissions to a role
- **Use Case**: Admin interface for role management

#### `getRolePermissions(roleId)`

- **Purpose**: Get all permissions for a specific role
- **Use Case**: Role management interface

## 🚀 Practical Implementation Examples

### Example 1: User Management Routes

```typescript
// src/modules/user/routes.ts
import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { requireAnyPermission, requirePermission } from '@/middleware/rbac';

import {
  createUserController,
  deleteUserController,
  exportUsersController,
  getUsersController,
  updateUserController,
} from './services';

const router = Router();

// View users - requires users:view
router.get('/', authorize('ADMIN', 'USER'), requirePermission('users', 'view'), getUsersController);

// Create user - requires users:create
router.post('/', authorize('ADMIN'), requirePermission('users', 'create'), createUserController);

// Update user - requires users:edit
router.put('/:id', authorize('ADMIN'), requirePermission('users', 'edit'), updateUserController);

// Delete user - requires users:delete (high-level permission)
router.delete(
  '/:id',
  authorize('ADMIN'),
  requirePermission('users', 'delete'),
  deleteUserController
);

// Export users - requires either export or view permission
router.get(
  '/export',
  authorize('ADMIN', 'USER'),
  requireAnyPermission([
    ['users', 'export'],
    ['users', 'view'], // Fallback for basic users
  ]),
  exportUsersController
);

export default router;
```

### Example 2: Application Management Routes

```typescript
// src/modules/applications/routes.ts
import { Router } from 'express';

import { authorize } from '@/middleware/authorize';
import { requireAllPermissions, requirePermission } from '@/middleware/rbac';

const router = Router();

// View applications
router.get(
  '/',
  authorize('ADMIN', 'USER'),
  requirePermission('applications', 'view'),
  getApplicationsController
);

// Approve application - requires both view and approve
router.post(
  '/:id/approve',
  authorize('ADMIN'),
  requireAllPermissions([
    ['applications', 'view'],
    ['applications', 'approve'],
  ]),
  approveApplicationController
);

// Reject application
router.post(
  '/:id/reject',
  authorize('ADMIN'),
  requirePermission('applications', 'reject'),
  rejectApplicationController
);

export default router;
```

### Example 3: Service-Level Permission Checking

```typescript
// src/modules/user/services.ts
import { checkUserPermission } from '@/modules/rbac/services';
import { serviceHandler } from '@/utils/serviceHandler';

export const getUserDetailsController = serviceHandler(userDetailsSchema, async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user.id;

  // Check if user can view other users' details
  const canViewOtherUsers = await checkUserPermission(requestingUserId, 'users', 'view');

  // Users can always view their own details
  if (userId !== requestingUserId && !canViewOtherUsers) {
    throw new ApiError('Access denied', 403);
  }

  const user = await getUserById(userId);
  return res.success('User details retrieved', { user });
});
```

### Example 4: Frontend Permission Integration

```typescript
// src/modules/user/services.ts - Get user with permissions for frontend
export const getCurrentUserWithPermissions = serviceHandler(z.object({}), async (req, res) => {
  const userId = req.user.id;

  // Get user permissions for frontend
  const { permissions, modulePermissions } = await getUserPermissionsByModule(userId);

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
    with: {
      role: true,
    },
  });

  return res.success('User data with permissions', {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.roleName,
    },
    permissions,
    modulePermissions,
  });
});
```

## 📋 Important Notes & Best Practices

### 1. **Always Use Authentication First**

```typescript
// ✅ Correct order
router.get(
  '/users',
  authorize('ADMIN', 'USER'), // Authentication first
  requirePermission('users', 'view'), // Then authorization
  controller
);

// ❌ Wrong order
router.get(
  '/users',
  requirePermission('users', 'view'), // This will fail - no user context
  authorize('ADMIN', 'USER'),
  controller
);
```

### 2. **Permission Granularity**

- Use specific permissions: `requirePermission('users', 'edit')` instead of just checking role
- Combine permissions for complex operations: `requireAllPermissions()`
- Provide alternative access: `requireAnyPermission()`

### 3. **Module Organization**

```typescript
// ✅ Good: Organize by feature modules
const MODULE_CONFIGS = {
  users: { permissions: ['create', 'view', 'edit', 'delete'] },
  applications: { permissions: ['view', 'approve', 'reject'] },
  dashboard: { permissions: ['view'] },
};

// ❌ Avoid: Too granular or too broad permissions
```

### 4. **Error Handling**

```typescript
// The middleware automatically throws 403 errors with descriptive messages
// "Access denied. Required permission: users:edit"
```

### 5. **Performance Considerations**

- Permission checks are cached during the request lifecycle
- Database queries use proper indexing on roleId and moduleId
- Consider caching user permissions for frequently accessed data

## 🔧 Setup Instructions

### 1. **Initialize RBAC System**

```bash
# Run the seeder to create modules, permissions, and default roles
npm run db:seed:rbac
```

### 2. **Create Default Roles**

The seeder creates:

- **Super Admin**: All permissions across all modules
- **Admin**: Most permissions except critical delete operations
- **User**: Limited view permissions for dashboard and reports

### 3. **Assign Role to User**

```typescript
// Assign role when creating user
await db.insert(models.users).values({
  name: 'John Doe',
  email: 'john@example.com',
  roleId: adminRoleId, // Single role assignment
  // ... other fields
});

// Update existing user's role
await db.update(models.users).set({ roleId: newRoleId }).where(eq(models.users.id, userId));
```

This RBAC system provides fine-grained permission control while maintaining simplicity with single-role-per-user architecture! 🎯
