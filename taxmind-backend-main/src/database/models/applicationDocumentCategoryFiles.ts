import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { applicationDocumentCategories } from './applicationDocumentCategories';
import { files } from './files';

export const applicationDocumentCategoryFiles = pgTable(
  'application_document_category_files',
  {
    applicationDocumentCategoryId: uuid()
      .references(() => applicationDocumentCategories.id, { onDelete: 'cascade' })
      .notNull(),
    fileId: uuid()
      .references(() => files.id, { onDelete: 'cascade' })
      .notNull(), // Uploaded file reference (nullable until file is uploaded)

    // Audit fields
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(), // When request was created
  },
  (t) => [
    index().on(t.fileId), // Index for file lookups
    index().on(t.applicationDocumentCategoryId), // Index for application document category lookups
    index().on(t.createdAt), // Index for sorting/filtering by creation date
    unique().on(t.applicationDocumentCategoryId, t.fileId), // Ensure one file per application document category
  ]
);

/**
 * Relations for application_documents
 * Connects to admin, application, document category, and file tables.
 */
export const applicationDocumentCategoryFilesRelations = relations(
  applicationDocumentCategoryFiles,
  ({ one }) => ({
    applicationDocumentCategory: one(applicationDocumentCategories, {
      fields: [applicationDocumentCategoryFiles.applicationDocumentCategoryId],
      references: [applicationDocumentCategories.id],
    }), // Category/type of requested document
    file: one(files, {
      fields: [applicationDocumentCategoryFiles.fileId],
      references: [files.id],
    }), // Uploaded file (if any)
  })
);
