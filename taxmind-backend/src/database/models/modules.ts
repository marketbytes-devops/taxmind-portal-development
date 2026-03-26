import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { modulePermissions } from './modulePermissions';

/**
 * Table: modules
 * Defines all available modules in the system (users, applications, dashboard, etc.)
 */
export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'users', 'applications', 'dashboard'
    displayName: varchar('display_name', { length: 255 }).notNull(), // e.g., 'User Management', 'Applications'
    description: text('description'),
    isActive: boolean('is_active').default(true),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('modules_name_idx').on(t.name), index('modules_is_active_idx').on(t.isActive)]
);

/**
 * Relations for modules
 */
export const modulesRelations = relations(modules, ({ many }) => ({
  modulePermissions: many(modulePermissions),
}));
