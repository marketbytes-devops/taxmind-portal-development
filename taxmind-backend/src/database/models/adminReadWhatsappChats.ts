import { relations } from 'drizzle-orm';
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { whatsappChats } from './whatsappChats';

export const adminReadWhatsappChats = pgTable(
  'admin_read_whatsapp_chats',
  {
    whatsappChatId: uuid()
      .notNull()
      .references(() => whatsappChats.id, { onDelete: 'cascade' }),
    adminId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    readAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.whatsappChatId, t.adminId] }),
    index().on(t.adminId),
    index().on(t.whatsappChatId),
  ]
);

export const adminReadWhatsappChatsRelations = relations(adminReadWhatsappChats, ({ one }) => ({
  chat: one(whatsappChats, {
    fields: [adminReadWhatsappChats.whatsappChatId],
    references: [whatsappChats.id],
  }),
  user: one(admins, {
    fields: [adminReadWhatsappChats.adminId],
    references: [admins.id],
  }),
}));
