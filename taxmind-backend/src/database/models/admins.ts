import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { chats } from './chats';
import { roles } from './roles';

export const admins = pgTable(
  'admins',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    accessToken: text(),
    refreshToken: text(),
    status: boolean().default(true).notNull(),
    emailOtp: integer(),
    emailOtpExpires: timestamp({ mode: 'date' }),
    emailVerifiedAt: timestamp({ mode: 'date' }),
    isEmailOtpVerified: boolean().default(false).notNull(),
    roleId: uuid()
      .notNull()
      .references(() => roles.id),
    lastActivityAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
    fcmToken: text(),
  },
  (t) => ({
    adminEmailIdx: uniqueIndex().on(t.email),
    adminRoleIdx: index().on(t.roleId),
  })
);

export const adminsRelations = relations(admins, ({ one, many }) => ({
  role: one(roles, { fields: [admins.roleId], references: [roles.id] }),
  sentChats: many(chats),
}));
