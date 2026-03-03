import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { chats } from './chats';

export const adminReadChats = pgTable(
  'admin_read_chats',
  {
    chatId: uuid()
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    adminId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    readAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.chatId, t.adminId] }),
    index().on(t.adminId),
    index().on(t.chatId),
  ]
);

export const adminReadChatsRelations = relations(adminReadChats, ({ one }) => ({
  chat: one(chats, {
    fields: [adminReadChats.chatId],
    references: [chats.id],
  }),
  user: one(admins, {
    fields: [adminReadChats.adminId],
    references: [admins.id],
  }),
}));
