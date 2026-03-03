import { z } from 'zod';

// ═══════════════════════════════════════════════════════════
// ROLE MANAGEMENT VALIDATIONS
// ═══════════════════════════════════════════════════════════

export const createRoleSchema = z.object({
  body: z.object({
    roleName: z.string({ message: 'Role name is required' }).min(1),
    modulePermissionIds: z
      .array(z.string().uuid({ message: 'Invalid permission ID format' }))
      .min(1, { message: 'At least one permission is required' }),
  }),
});

export const getRoleSchema = z.object({
  params: z.object({
    roleId: z.string().uuid({ message: 'Valid role ID is required' }),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    roleId: z.string().uuid({ message: 'Valid role ID is required' }),
  }),
  body: z.object({
    roleName: z.string({ message: 'Role name is required' }).min(1),
    modulePermissionIds: z
      .array(z.string().uuid({ message: 'Invalid permission ID format' }))
      .min(1, { message: 'At least one permission is required' }),
  }),
});

export const deleteRoleSchema = z.object({
  params: z.object({
    roleId: z.string().uuid({ message: 'Valid role ID is required' }),
  }),
});

export const getRolesSchema = z.object({
  query: z.object({
    keyword: z.string().optional(),
  }),
});

// ═══════════════════════════════════════════════════════════
// PERMISSION ASSIGNMENT VALIDATIONS
// ═══════════════════════════════════════════════════════════

export const assignPermissionsToRoleSchema = z.object({
  params: z.object({
    roleId: z.string().uuid({ message: 'Valid role ID is required' }),
  }),
  body: z.object({
    modulePermissionIds: z
      .array(z.string().uuid({ message: 'Invalid permission ID format' }))
      .min(0, { message: 'Permission IDs array is required' }),
  }),
});

export const getRolePermissionsSchema = z.object({
  params: z.object({
    roleId: z.string().uuid({ message: 'Valid role ID is required' }),
  }),
});

// ═══════════════════════════════════════════════════════════
// MODULE MANAGEMENT VALIDATIONS
// ═══════════════════════════════════════════════════════════

export const getAllModulesSchema = z.object({});

export const initializeModulesSchema = z.object({});
