import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { modulePermissions } from './modulePermissions';
import { roles } from './roles';

/**
 * Table: role_module_permissions
 * Junction table that defines which permissions each role has for each module
 */
export const roleModulePermissions = pgTable(
  'role_module_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roleId: uuid('role_id')
      .references(() => roles.id)
      .notNull(), // Reference to role
    modulePermissionId: uuid('module_permission_id')
      .references(() => modulePermissions.id)
      .notNull(), // Reference to module permission
    isEnabled: boolean('is_enabled').default(true), // Whether this permission is enabled for the role

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('role_module_permissions_role_id_idx').on(t.roleId),
    index('role_module_permissions_module_permission_id_idx').on(t.modulePermissionId),
    // Ensure unique role-permission combination
    unique('unique_role_module_permission').on(t.roleId, t.modulePermissionId),
  ]
);

/**
 * Relations for role_module_permissions
 */
export const roleModulePermissionsRelations = relations(roleModulePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [roleModulePermissions.roleId],
    references: [roles.id],
  }),
  modulePermission: one(modulePermissions, {
    fields: [roleModulePermissions.modulePermissionId],
    references: [modulePermissions.id],
  }),
}));
