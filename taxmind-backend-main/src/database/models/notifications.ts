import { relations } from 'drizzle-orm';
import { json, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { notificationTypesArr } from '@/constants';

import { userNotifications } from './userNotifications';

export const notifications = pgTable('notifications', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  title: text().notNull(),
  message: text().notNull(),
  data: json(),
  notificationType: varchar({ enum: notificationTypesArr as TPgEnum }).notNull(),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ many }) => ({
  userNotifications: many(userNotifications),
}));
