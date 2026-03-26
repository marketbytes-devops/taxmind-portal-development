import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Document Categories
export const documentCategories = pgTable('document_categories', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Category details
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Audit fields
  deletedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
