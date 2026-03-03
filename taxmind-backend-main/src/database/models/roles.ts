import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { roleModulePermissions } from './roleModulePermissions';

export const roles = pgTable('roles', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  roleName: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp({ mode: 'date' }).defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  roleModulePermissions: many(roleModulePermissions),
}));
