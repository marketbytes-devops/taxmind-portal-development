import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { admins } from './admins';
import { senderTypeEnum } from './chats';
import { users } from './users';

// Message types enum
const messageTypeEnum = pgEnum('message_type', [
  'audio',
  'document',
  'image',
  'sticker',
  'video',
  'text',
]);

// Sender types enum

export const whatsappChats = pgTable(
  'whatsapp_chats',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    // Core message data
    content: customEncryptedType<string>('text', 'content'),
    messageType: messageTypeEnum().default('text').notNull(),
    url: customEncryptedType<string>('text', 'url'),
    mediaId: varchar('media_id', { length: 100 }),
    mimeType: varchar('mime_type', { length: 100 }),
    fileName: varchar('file_name', { length: 255 }),

    // Sender information with foreign key relationships
    phone: customEncryptedType<string>('text', 'phone').notNull(),
    hashedPhone: text().notNull(),
    senderType: senderTypeEnum().notNull(), // user or admin
    userId: uuid().references(() => users.id, { onDelete: 'cascade' }), // Always present for user messages, null for admin messages
    adminId: uuid().references(() => admins.id), // Always present for admin messages, null for user messages
    isRegistered: boolean().default(false).notNull(),

    // Message status
    isRead: boolean().default(false).notNull(),
    readAt: timestamp({ mode: 'date' }),

    // Timestamps
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp({ mode: 'date' }), // Soft delete
  },
  (t) => [
    // Indexes for fast querying
    index('whatsapp_chats_user_idx').on(t.userId),
    index('whatsapp_chats_admin_idx').on(t.adminId),
    index('whatsapp_chats_sender_type_idx').on(t.senderType),
    index('whatsapp_chats_unread_idx').on(t.isRead),
    index('whatsapp_chats_conversation_direct_idx').on(t.userId, t.adminId),
    index('whatsapp_chats_created_at_idx').on(t.createdAt),
    index('whatsapp_chats_hashed_phone_idx').on(t.hashedPhone),
  ]
);

export const whatsappChatsRelations = relations(whatsappChats, ({ one }) => ({
  user: one(users, { fields: [whatsappChats.userId], references: [users.id] }),
  admin: one(admins, { fields: [whatsappChats.adminId], references: [admins.id] }),
}));
