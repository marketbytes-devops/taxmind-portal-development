import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { notifications } from './notifications';

export const adminNotifications = pgTable(
  'admin_notifications',
  {
    notificationId: uuid()
      .notNull()
      .references(() => notifications.id),
    adminId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    readAt: timestamp({ mode: 'date' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.notificationId, t.adminId] }),
    adminNotificationAdminIdx: index().on(t.adminId),
    adminNotificationNotificationIdx: index().on(t.notificationId),
  })
);

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  admin: one(admins, {
    fields: [adminNotifications.adminId],
    references: [admins.id],
  }),
  notification: one(notifications, {
    fields: [adminNotifications.notificationId],
    references: [notifications.id],
  }),
}));
