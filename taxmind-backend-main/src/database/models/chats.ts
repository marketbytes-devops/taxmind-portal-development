import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { admins } from './admins';
import { applications } from './applications';
import { files } from './files';
import { users } from './users';

// Message types enum
export const messageTypeEnum = pgEnum('message_type', [
  'text',
  'file',
  'image',
  'video',
  'audio',
  'document',
]);

// Chat types enum
export const chatTypeEnum = pgEnum('chat_type', ['application', 'support']);

// Sender types enum
export const senderTypeEnum = pgEnum('sender_type', ['user', 'admin']);

export const chats = pgTable(
  'chats',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    // Core message data
    content: customEncryptedType<string>('text', 'content').notNull(),
    messageType: messageTypeEnum().default('text').notNull(),
    chatType: chatTypeEnum().notNull(), // application or support

    // Sender information with foreign key relationships
    senderType: senderTypeEnum().notNull(), // user or admin
    userId: uuid()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(), // Always present for user and admin messages
    adminId: uuid().references(() => admins.id), // Always present for admin messages, null for user messages

    // For application-based chats
    applicationId: uuid().references(() => applications.id, { onDelete: 'cascade' }), // Reference to tax application

    // File attachments
    fileId: uuid().references(() => files.id), // Reference to file

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
    index('chats_user_idx').on(t.userId),
    index('chats_admin_idx').on(t.adminId),
    index('chats_sender_type_idx').on(t.senderType),
    index('chats_application_idx').on(t.applicationId),
    index('chats_chat_type_idx').on(t.chatType),
    index('chats_unread_idx').on(t.isRead),
    index('chats_conversation_app_idx').on(t.chatType, t.applicationId),
    index('chats_conversation_direct_idx').on(t.userId, t.adminId),
    index('chats_created_at_idx').on(t.createdAt),
  ]
);

export const chatsRelations = relations(chats, ({ one }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  admin: one(admins, { fields: [chats.adminId], references: [admins.id] }),
}));
