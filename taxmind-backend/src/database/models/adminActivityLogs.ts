import { relations } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { activityLogEntityNamesArr } from '@/constants';

import { admins } from './admins';

export const actionTypes = pgEnum('action_types', ['insert', 'update', 'delete']);

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    entityName: varchar({ length: 255, enum: activityLogEntityNamesArr as TPgEnum }).notNull(),
    entityId: uuid().notNull(),
    action: actionTypes(),
    modifiedUserId: uuid()
      .notNull()
      .references(() => admins.id),
    oldData: jsonb(),
    newData: jsonb(),
    modifiedAt: timestamp().defaultNow().notNull(),
  },
  (t) => ({
    activityLogModifiedUserIdx: index().on(t.modifiedUserId),
  })
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  modifiedBy: one(admins, {
    fields: [activityLogs.modifiedUserId],
    references: [admins.id],
  }),
}));
