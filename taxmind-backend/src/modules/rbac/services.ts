import { SQL, and, eq, ilike, inArray, ne, notExists } from 'drizzle-orm';

import { activityLogEntityNames } from '@/constants';
import { MODULE_CONFIGS, getPermissionDisplayName } from '@/constants/modulePermissions';
import { db } from '@/database';
import * as models from '@/database/models';
import { activityLog } from '@/logger/activityLog';
import ApiError from '@/utils/apiError';
import { serviceHandler } from '@/utils/serviceHandler';
import { transformRoleDataExtended } from '@/utils/transformRoleData';

import {
  assignPermissionsToRoleSchema,
  createRoleSchema,
  deleteRoleSchema,
  getAllModulesSchema,
  getRolePermissionsSchema,
  getRoleSchema,
  getRolesSchema,
  updateRoleSchema,
} from './validations';

interface ModulePermissionGroup {
  module: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date;
  };
  permissions: {
    id: string;
    moduleId: string;
    permissionName: string;
    description: string | null;
    createdAt: Date | null;
    updatedAt: Date;
  }[];
}

/**
 * Initialize modules and their permissions in the database
 */
export const initializeModulesAndPermissions = async () => {
  try {
    await db.transaction(async (tx) => {
      for (const [moduleName, config] of Object.entries(MODULE_CONFIGS)) {
        // Create or update module
        const [module] = await tx
          .insert(models.modules)
          .values({
            name: config.name,
            displayName: config.displayName,
            isActive: true,
          })
          .onConflictDoUpdate({
            target: models.modules.name,
            set: {
              displayName: config.displayName,
              isActive: true,
              updatedAt: new Date(),
            },
          })
          .returning();

        // Create or update module permissions
        for (const permission of config.permissions) {
          await tx
            .insert(models.modulePermissions)
            .values({
              moduleId: module.id,
              permissionName: permission,
              displayName: getPermissionDisplayName(moduleName, permission),
              isActive: true,
            })
            .onConflictDoUpdate({
              target: [models.modulePermissions.moduleId, models.modulePermissions.permissionName],
              set: {
                displayName: getPermissionDisplayName(moduleName, permission),
                isActive: true,
                updatedAt: new Date(),
              },
            });
        }
      }
    });

    console.log('Modules and permissions initialized successfully');
  } catch (error) {
    console.error('Failed to initialize modules and permissions:', error);
    throw error;
  }
};

/**
 * Get all modules with their permissions
 */
export const getAllModulesWithPermissions = serviceHandler(
  getAllModulesSchema,
  async (req, res) => {
    const modules = await db.query.modules.findMany({
      where: eq(models.modules.isActive, true),
      with: {
        modulePermissions: {
          where: eq(models.modulePermissions.isActive, true),
          orderBy: models.modulePermissions.permissionName,
        },
      },
      orderBy: models.modules.name,
    });

    return res.success('Modules retrieved successfully', modules);
  }
);

/**
 * Assign permissions to a role
 */
export const assignPermissionsToRole = serviceHandler(
  assignPermissionsToRoleSchema,
  async (req, res) => {
    const { roleId } = req.params;
    const { modulePermissionIds } = req.body;

    try {
      await db.transaction(async (tx) => {
        // Verify role exists
        const role = await tx.query.roles.findFirst({
          where: eq(models.roles.id, roleId),
        });

        if (!role) {
          throw new Error('Role not found');
        }

        // Remove existing permissions for this role
        await tx
          .delete(models.roleModulePermissions)
          .where(eq(models.roleModulePermissions.roleId, roleId));

        // Add new permissions
        if (modulePermissionIds.length > 0) {
          const permissionData = modulePermissionIds.map((permissionId) => ({
            roleId,
            modulePermissionId: permissionId,
            isEnabled: true,
          }));

          await tx.insert(models.roleModulePermissions).values(permissionData);
        }
      });

      return res.success('Permissions assigned successfully');
    } catch (error) {
      throw new Error(
        `Failed to assign permissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
);

/**
 * Get role permissions
 */
export const getRolePermissions = serviceHandler(getRolePermissionsSchema, async (req, res) => {
  const { roleId } = req.params;

  const rolePermissions = await db.query.roleModulePermissions.findMany({
    where: and(
      eq(models.roleModulePermissions.roleId, roleId),
      eq(models.roleModulePermissions.isEnabled, true)
    ),
    with: {
      modulePermission: {
        with: {
          module: true,
        },
      },
    },
  });

  // Group permissions by module
  const permissionsByModule = rolePermissions.reduce(
    (acc, rp) => {
      const moduleName = rp.modulePermission.module.name;
      if (!acc[moduleName]) {
        acc[moduleName] = {
          module: rp.modulePermission.module,
          permissions: [],
        };
      }
      acc[moduleName].permissions.push(rp.modulePermission);
      return acc;
    },
    {} as Record<string, ModulePermissionGroup>
  );

  return res.success('Role permissions retrieved successfully', {
    roleId,
    modules: Object.values(permissionsByModule),
  });
});

/**
 * Check if user has specific permission
 */
export const checkUserPermission = async (
  adminId: string,
  moduleName: string,
  permissionName: string
): Promise<boolean> => {
  try {
    // Get admin with their role and permissions
    const admin = await db.query.admins.findFirst({
      where: eq(models.admins.id, adminId),
      with: {
        role: {
          with: {
            roleModulePermissions: {
              where: eq(models.roleModulePermissions.isEnabled, true),
              with: {
                modulePermission: {
                  with: {
                    module: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!admin || !admin.role) {
      return false;
    }

    // Check if admin's role has the required permission
    for (const rolePermission of admin.role.roleModulePermissions) {
      const { module, permissionName: permission } = rolePermission.modulePermission;
      if (module.name === moduleName && permission === permissionName) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
};

/**
 * Get all permissions for a user
 */
export const getUserPermissions = async (adminId: string): Promise<string[]> => {
  try {
    // Get admin with their role and permissions
    const admin = await db.query.admins.findFirst({
      where: eq(models.admins.id, adminId),
      with: {
        role: {
          with: {
            roleModulePermissions: {
              where: eq(models.roleModulePermissions.isEnabled, true),
              with: {
                modulePermission: {
                  with: {
                    module: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!admin || !admin.role) {
      return [];
    }

    const permissions: string[] = [];

    // Extract permissions from admin's role
    for (const rolePermission of admin.role.roleModulePermissions) {
      const { module, permissionName } = rolePermission.modulePermission;
      permissions.push(`${module.name}:${permissionName}`);
    }

    return permissions;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
};

/**
 * Get admin's all permissions grouped by modules
 */
export const getUserPermissionsByModule = async (adminId: string) => {
  try {
    // Get admin with their role and permissions
    const admin = await db.query.admins.findFirst({
      where: eq(models.admins.id, adminId),
      with: {
        role: {
          with: {
            roleModulePermissions: {
              where: eq(models.roleModulePermissions.isEnabled, true),
              with: {
                modulePermission: {
                  with: {
                    module: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!admin || !admin.role) {
      return {
        permissions: [],
        modulePermissions: {},
      };
    }

    // Collect all permissions
    const permissions = new Set<string>();
    const modulePermissions: Record<string, string[]> = {};

    for (const rolePermission of admin.role.roleModulePermissions) {
      const { module, permissionName } = rolePermission.modulePermission;
      const permissionKey = `${module.name}:${permissionName}`;

      permissions.add(permissionKey);

      if (!modulePermissions[module.name]) {
        modulePermissions[module.name] = [];
      }

      if (!modulePermissions[module.name].includes(permissionName)) {
        modulePermissions[module.name].push(permissionName);
      }
    }

    return {
      permissions: Array.from(permissions),
      modulePermissions,
    };
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      permissions: [],
      modulePermissions: {},
    };
  }
};

// ═══════════════════════════════════════════════════════════
// ROLE MANAGEMENT FUNCTIONS (Migrated from roles module)
// ═══════════════════════════════════════════════════════════

/**
 * Get all roles with their permissions
 */
export const getRoles = serviceHandler(getRolesSchema, async (req, res) => {
  const { keyword } = req.query;
  const { limit, offset, page, size } = req.pagination;

  let filters: (SQL | undefined)[] = [ne(models.roles.roleName, 'Super Admin')];

  if (keyword) {
    filters.push(ilike(models.roles.roleName, `%${keyword}%`));
  }

  // Check if role is deletable (not assigned to any admins)
  const isDeletable = db
    .select({ roleId: models.admins.roleId })
    .from(models.admins)
    .where(eq(models.admins.roleId, models.roles.id))
    .limit(1);

  const [totalRoles, roles] = await Promise.all([
    db.$count(models.roles, and(...filters)),
    db.query.roles.findMany({
      with: {
        roleModulePermissions: {
          where: eq(models.roleModulePermissions.isEnabled, true),
          with: {
            modulePermission: {
              with: {
                module: true,
              },
            },
          },
        },
      },
      extras: {
        isDeletable: notExists(isDeletable).as('isDeletable'),
      },
      where: and(...filters),
      limit,
      offset,
      orderBy: (role, { desc }) => [desc(role.createdAt)],
    }),
  ]);

  const responseData = roles.map((role) => transformRoleDataExtended(role));

  return res.data('Roles retrieved successfully', responseData, { page, size, total: totalRoles });
});
/**
 * Get all roles without pagination
 */
export const getAllRoles = serviceHandler(getRolesSchema, async (req, res) => {
  const { keyword } = req.query;

  let filters: (SQL | undefined)[] = [ne(models.roles.roleName, 'Super Admin')];

  if (keyword) {
    filters.push(ilike(models.roles.roleName, `%${keyword}%`));
  }

  // Check if role is deletable (not assigned to any admins)
  const isDeletable = db
    .select({ roleId: models.admins.roleId })
    .from(models.admins)
    .where(eq(models.admins.roleId, models.roles.id))
    .limit(1);

  const [roles] = await Promise.all([
    db.query.roles.findMany({
      with: {
        roleModulePermissions: {
          where: eq(models.roleModulePermissions.isEnabled, true),
          with: {
            modulePermission: {
              with: {
                module: true,
              },
            },
          },
        },
      },
      extras: {
        isDeletable: notExists(isDeletable).as('isDeletable'),
      },
      where: and(...filters),

      orderBy: (role, { desc }) => [desc(role.createdAt)],
    }),
  ]);

  const responseData = roles.map((role) => transformRoleDataExtended(role));

  return res.data('Roles retrieved successfully', responseData);
});

/**
 * Create a new role
 */
export const createRole = serviceHandler(createRoleSchema, async (req, res) => {
  const { roleName, modulePermissionIds } = req.body;

  // Check if role already exists
  const roleExist = await db.query.roles.findFirst({
    where: eq(models.roles.roleName, roleName),
  });

  if (roleExist) {
    throw new ApiError(`A role with the name ${roleName} already exists`, 400);
  }

  // validate all modulePermissionIds are valid
  const validPermissions = await db.query.modulePermissions.findMany({
    where: inArray(models.modulePermissions.id, modulePermissionIds),
  });

  if (validPermissions.length !== modulePermissionIds.length) {
    throw new ApiError('One or more module permissions are invalid', 400);
  }

  const role = await db.transaction(async (tx) => {
    // Create the role
    const [role] = await tx.insert(models.roles).values({ roleName }).returning();

    // Assign permissions to the role
    const rolePermissions = modulePermissionIds.map((permissionId) => ({
      roleId: role.id,
      modulePermissionId: permissionId,
      isEnabled: true,
    }));

    await tx.insert(models.roleModulePermissions).values(rolePermissions);

    // Log the activity within the transaction
    const activityLogData = {
      entityName: activityLogEntityNames.role,
      entityId: role.id,
      action: 'insert' as const,
      modifiedUserId: req.admin.id,
      oldData: null,
      newData: role,
    };
    await activityLog(activityLogData);

    return role;
  });

  return res.success('New role has been created successfully', role, 201);
});

/**
 * Get role details with permissions
 */
export const getRoleDetails = serviceHandler(getRoleSchema, async (req, res) => {
  const { roleId } = req.params;

  const role = await db.query.roles.findFirst({
    where: eq(models.roles.id, roleId),
    with: {
      roleModulePermissions: {
        where: eq(models.roleModulePermissions.isEnabled, true),
        with: {
          modulePermission: {
            with: {
              module: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw new ApiError('Role not found', 404);
  }

  return res.success('Role details retrieved successfully', transformRoleDataExtended(role));
});

/**
 * Update role details and permissions
 */
export const updateRole = serviceHandler(updateRoleSchema, async (req, res) => {
  const { roleId } = req.params;
  const { roleName, modulePermissionIds } = req.body;

  // Check if role exists
  const roleExist = await db.query.roles.findFirst({
    where: eq(models.roles.id, roleId),
  });

  if (!roleExist) {
    throw new ApiError('Role not found', 404);
  }

  // Check if another role with the same name exists (excluding current role)
  const duplicateRole = await db.query.roles.findFirst({
    where: and(eq(models.roles.roleName, roleName), ne(models.roles.id, roleId)),
  });

  if (duplicateRole) {
    throw new ApiError(`A role with the name ${roleName} already exists`, 400);
  }

  const role = await db.transaction(async (tx) => {
    // Update role name
    const [role] = await tx
      .update(models.roles)
      .set({ roleName, updatedAt: new Date() })
      .where(eq(models.roles.id, roleId))
      .returning();

    // Remove existing permissions
    await tx
      .delete(models.roleModulePermissions)
      .where(eq(models.roleModulePermissions.roleId, roleId));

    // Add new permissions
    const rolePermissions = modulePermissionIds.map((permissionId) => ({
      roleId: role.id,
      modulePermissionId: permissionId,
      isEnabled: true,
    }));

    await tx.insert(models.roleModulePermissions).values(rolePermissions);

    // Log the activity within the transaction
    const activityLogData = {
      entityName: activityLogEntityNames.role,
      entityId: roleId,
      action: 'update' as const,
      modifiedUserId: req.admin.id,
      oldData: roleExist,
      newData: role,
    };
    await activityLog(activityLogData);

    return role;
  });

  return res.success('Role details updated successfully', role);
});

/**
 * Delete a role
 */
export const deleteRole = serviceHandler(deleteRoleSchema, async (req, res) => {
  const { roleId } = req.params;

  // Check if role exists
  const roleExist = await db.query.roles.findFirst({
    where: eq(models.roles.id, roleId),
  });

  if (!roleExist) {
    throw new ApiError('Role not found', 404);
  }

  // Check if role is assigned to any admins
  const roleIsAssociatedToAnyAdmin = await db.query.admins.findFirst({
    where: eq(models.admins.roleId, roleId),
  });

  if (roleIsAssociatedToAnyAdmin) {
    throw new ApiError('Unable to delete the role as it is assigned to admins', 400);
  }

  await db.transaction(async (tx) => {
    // Delete role permissions first
    await tx
      .delete(models.roleModulePermissions)
      .where(eq(models.roleModulePermissions.roleId, roleId));

    // Delete the role
    await tx.delete(models.roles).where(eq(models.roles.id, roleId));

    // Log the activity within the transaction
    const activityLogData = {
      entityName: activityLogEntityNames.role,
      entityId: roleId,
      action: 'delete' as const,
      modifiedUserId: req.admin.id,
      oldData: roleExist,
      newData: null,
    };
    await activityLog(activityLogData);
  });

  return res.success('Role has been successfully deleted');
});
