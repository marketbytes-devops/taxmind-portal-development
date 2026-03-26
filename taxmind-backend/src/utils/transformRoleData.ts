/**
 * Utility for transforming role data to frontend-friendly format
 */

/**
 * Helper function to transform role data to grouped modules format
 */
export const transformRoleData = (role: {
  id: string;
  roleName: string;
  roleModulePermissions: Array<{
    modulePermission: {
      id: string;
      permissionName: string;
      displayName: string;
      description: string | null;
      module: {
        id: string;
        name: string;
        displayName: string;
        description: string | null;
      };
    };
  }>;
}) => {
  // Group permissions by module
  const moduleMap = new Map();

  role.roleModulePermissions.forEach((rmp) => {
    const moduleId = rmp.modulePermission.module.id;
    const module = rmp.modulePermission.module;
    const permission = {
      id: rmp.modulePermission.id,
      permissionName: rmp.modulePermission.permissionName,
      displayName: rmp.modulePermission.displayName,
      description: rmp.modulePermission.description || '',
    };

    if (!moduleMap.has(moduleId)) {
      moduleMap.set(moduleId, {
        id: module.id,
        name: module.name,
        displayName: module.displayName,
        description: module.description || '',
        permissions: [],
      });
    }

    moduleMap.get(moduleId).permissions.push(permission);
  });

  return {
    id: role.id,
    roleName: role.roleName,
    modules: Array.from(moduleMap.values()),
  };
};

/**
 * Extended version that includes additional role metadata
 */
export const transformRoleDataExtended = (role: {
  id: string;
  roleName: string;
  isDeletable?: unknown;
  createdAt?: Date | null;
  updatedAt?: Date;
  roleModulePermissions: Array<{
    modulePermission: {
      id: string;
      permissionName: string;
      displayName: string;
      description: string | null;
      module: {
        id: string;
        name: string;
        displayName: string;
        description: string | null;
      };
    };
  }>;
}) => {
  const baseTransform = transformRoleData(role);

  return {
    ...baseTransform,
    isDeletable: Boolean(role.isDeletable),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
};
