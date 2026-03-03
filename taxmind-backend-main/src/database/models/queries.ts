import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { queryCategories } from './queryCategories';

export const queries = pgTable('queries', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: varchar({ length: 50 }).notNull(),
  email: varchar({ length: 50 }).notNull(),
  message: text().notNull(),
  categoryId: uuid().references(() => queryCategories.id),
  createdAt: timestamp().defaultNow().notNull(),
});

export const queriesRelations = relations(queries, ({ one }) => ({
  category: one(queryCategories, {
    fields: [queries.categoryId],
    references: [queryCategories.id],
  }),
}));
