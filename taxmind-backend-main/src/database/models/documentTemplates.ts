import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { files } from './files';

export const documentTemplates = pgTable('document_templates', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  name: text().unique().notNull(),
  templateFileId: uuid()
    .references(() => files.id)
    .notNull(), // Reference to files table
  deletedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const documentTemplatesRelations = relations(documentTemplates, ({ one }) => ({
  templateFile: one(files, {
    fields: [documentTemplates.templateFileId],
    references: [files.id],
  }),
}));
