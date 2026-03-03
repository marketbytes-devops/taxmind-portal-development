import { NextFunction, Request, Response } from 'express';

import { PermissionType } from '@/constants/modulePermissions';
import { checkUserPermission } from '@/modules/rbac/services';
import ApiError from '@/utils/apiError';

/**
 * Middleware to check if user has a specific permission
 * Usage: requirePermission('users', 'read')
 */
export const requirePermission =
  (moduleName: string, permissionName: PermissionType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If requester is not an admin, skip RBAC checks (user access allowed)
      if (!req.admin) return next();

      // Get admin ID from request (assumes admin is already authenticated)
      const adminId = req.admin.id;

      // Check if admin has the required permission
      const hasPermission = await checkUserPermission(adminId, moduleName, permissionName);

      if (!hasPermission) {
        throw new ApiError(
          `Access denied. Required permission: ${moduleName}:${permissionName}`,
          403
        );
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error checking permission:', error);
      throw new ApiError('Internal server error', 500);
    }
  };

/**
 * Middleware to check if user has all specified permissions
 * Usage: requireAllPermissions([['users', 'read'], ['users', 'write']])
 */
export const requireAllPermissions =
  (permissions: [string, string][]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If requester is not an admin, skip RBAC checks (user access allowed)
      if (!req.admin) return next();

      const adminId = req.admin.id;

      // Check all permissions
      for (const [moduleName, permissionName] of permissions) {
        const hasPermission = await checkUserPermission(adminId, moduleName, permissionName);

        if (!hasPermission) {
          throw new ApiError(
            `Access denied. Required permission: ${moduleName}:${permissionName}`,
            403
          );
        }
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error checking permissions:', error);
      throw new ApiError('Internal server error', 500);
    }
  };

/**
 * Middleware to check if user has any of the specified permissions
 * Usage: requireAnyPermission([['users', 'read'], ['admins', 'read']])
 */
export const requireAnyPermission =
  (permissions: [string, string][]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If requester is not an admin, skip RBAC checks (user access allowed)
      if (!req.admin) return next();

      const adminId = req.admin.id;

      // Check if admin has any of the permissions
      let hasAnyPermission = false;

      for (const [moduleName, permissionName] of permissions) {
        const hasPermission = await checkUserPermission(adminId, moduleName, permissionName);

        if (hasPermission) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        const permissionStrings = permissions.map(([module, perm]) => `${module}:${perm}`);
        throw new ApiError(`Access denied. Required any of: ${permissionStrings.join(', ')}`, 403);
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error checking permissions:', error);
      throw new ApiError('Internal server error', 500);
    }
  };

/**
 * Middleware to check module-level access (any permission in the module)
 * Usage: requireModuleAccess('users')
 */
export const requireModuleAccess =
  (moduleName: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If requester is not an admin, skip RBAC checks (user access allowed)
      if (!req.admin) return next();

      const adminId = req.admin.id;

      // Get all admin permissions and check if any belong to the module
      const { getUserPermissions } = await import('@/modules/rbac/services');
      const adminPermissions = await getUserPermissions(adminId);

      const hasModuleAccess = adminPermissions.some((permission) =>
        permission.startsWith(`${moduleName}:`)
      );

      if (!hasModuleAccess) {
        throw new ApiError(`Access denied. No permissions for module: ${moduleName}`, 403);
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error checking module access:', error);
      throw new ApiError('Internal server error', 500);
    }
  };
