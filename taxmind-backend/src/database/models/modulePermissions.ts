import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { modules } from './modules';
import { roleModulePermissions } from './roleModulePermissions';

/**
 * Table: module_permissions
 * Defines available permissions for each module (create, view, edit, delete, etc.)
 */
export const modulePermissions = pgTable(
  'module_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .references(() => modules.id)
      .notNull(), // Reference to module
    permissionName: varchar('permission_name', { length: 100 }).notNull(), // e.g., 'create', 'view', 'edit', 'delete'
    displayName: varchar('display_name', { length: 255 }).notNull(), // e.g., 'Create Users', 'View Dashboard'
    description: text('description'),
    isActive: boolean('is_active').default(true),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('module_permissions_module_id_idx').on(t.moduleId),
    index('module_permissions_permission_name_idx').on(t.permissionName),
    // Ensure unique permission per module
    unique('unique_module_permission').on(t.moduleId, t.permissionName),
  ]
);

/**
 * Relations for module_permissions
 */
export const modulePermissionsRelations = relations(modulePermissions, ({ one, many }) => ({
  module: one(modules, {
    fields: [modulePermissions.moduleId],
    references: [modules.id],
  }),
  roleModulePermissions: many(roleModulePermissions),
}));
