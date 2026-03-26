import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { notifications } from './notifications';
import { users } from './users';

export const userNotifications = pgTable(
  'user_notifications',
  {
    notificationId: uuid()
      .notNull()
      .references(() => notifications.id),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp({ mode: 'date' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.notificationId, t.userId] }),
    userNotificationUserIdx: index().on(t.userId),
    userNotificationNotificationIdx: index().on(t.notificationId),
  })
);

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
  notification: one(notifications, {
    fields: [userNotifications.notificationId],
    references: [notifications.id],
  }),
}));
