import { relations } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { files } from './files';

export const tax_credits = pgTable('tax_credits', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  iconId: uuid().references(() => files.id), // Reference to files table for icon
  description: text().notNull(),
  details: text().notNull(),
  status: boolean().default(true).notNull(),
  deletedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const taxCreditsRelations = relations(tax_credits, ({ one }) => ({
  icon: one(files, {
    fields: [tax_credits.iconId],
    references: [files.id],
  }),
}));
