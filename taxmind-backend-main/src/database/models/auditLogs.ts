// import { relations } from 'drizzle-orm';
// import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// import { activityLogEntityNamesArr } from '@/constants';

// import { actionTypes } from './adminActivityLogs';
// import { users } from './users';

// export const auditLogs = pgTable(
//   'audit_logs',
//   {
//     id: uuid().defaultRandom().primaryKey().notNull(),
//     entityName: varchar({ length: 255, enum: activityLogEntityNamesArr as TPgEnum }).notNull(),
//     entityId: uuid().notNull(),
//     action: actionTypes(),
//     userId: uuid()
//       .notNull()
//       .references(() => users.id),
//     details: jsonb(),
//     ipAddress: varchar({ length: 45 }).notNull(),
//     userAgent: text().notNull(),
//     createdAt: timestamp().defaultNow().notNull(),
//   },
//   (t) => ({
//     auditLogUserIdx: index().on(t.userId),
//   })
// );

// export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
//   user: one(users, {
//     fields: [auditLogs.userId],
//     references: [users.id],
//   }),
// }));
