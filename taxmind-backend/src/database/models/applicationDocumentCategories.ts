import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { admins } from './admins';
import { applicationDocumentCategoryFiles } from './applicationDocumentCategoryFiles';
import { applications } from './applications';
import { documentCategories } from './documentCategories';

// Enum for document request status
export const requestStatuses = pgEnum('application_document_statuses', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
]);

/**
 * Table: application_documents
 * Stores document requests for a user's application, including status, admin, category, file, and audit info.
 */
export const applicationDocumentCategories = pgTable(
  'application_document_categories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(), // Unique request ID
    status: requestStatuses(), // Request status: pending, accepted, rejected, withdrawn
    adminId: uuid().references(() => admins.id), // Admin who created/requested the document
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' })
      .notNull(), // Associated application
    documentCategoryId: uuid()
      .notNull()
      .references(() => documentCategories.id)
      .notNull(), // Document category/type requested
    isRequired: boolean('is_required').default(true), // Whether the document is required
    note: customEncryptedType<string>('text', 'note'), // Encrypted note from admin to user
    rejectedReason: customEncryptedType<string>('text', 'rejectedReason'), // Encrypted reason for rejection
    isAdditionalDocument: boolean('is_additional_document').default(true),

    // Audit fields
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(), // When request was created
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // When request was last updated
    deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
  },
  (t) => [
    index().on(t.adminId), // Index for admin lookups
    index().on(t.applicationId), // Index for application lookups
    index().on(t.createdAt), // Index for sorting/filtering by creation date
    index().on(t.status), // Index for status queries
  ]
);

/**
 * Relations for application_documents
 * Connects to admin, application, document category, and file tables.
 */
export const applicationDocumentCategoriesRelations = relations(
  applicationDocumentCategories,
  ({ one, many }) => ({
    admin: one(admins, {
      fields: [applicationDocumentCategories.adminId],
      references: [admins.id],
    }), // Admin who made the request
    application: one(applications, {
      fields: [applicationDocumentCategories.applicationId],
      references: [applications.id],
    }), // Application for which document is requested
    documentCategory: one(documentCategories, {
      fields: [applicationDocumentCategories.documentCategoryId],
      references: [documentCategories.id],
    }), // Category/type of requested document
    applicationDocumentCategoryFiles: many(applicationDocumentCategoryFiles),
  })
);
