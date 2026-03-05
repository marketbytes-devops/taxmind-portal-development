import { relations } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { admins } from './admins';
import { applicationDocumentCategories } from './applicationDocumentCategories';
import { applicationStatusHistories } from './applicationStatusHistories';
import { applicationStatuses } from './enums';
import { files } from './files';
import { paymentStatuses } from './payments';
import { questionnaireResponses } from './questionnaireResponses';
import { users } from './users';

/**
 * Table: applications
 * Stores user tax refund applications, including financial details, status, and audit info.
 */

export const applications = pgTable(
  'applications',
  {
    id: uuid().defaultRandom().primaryKey().notNull(), // Unique application ID

    // Searchable hash for filtering (HMAC)
    hashedApplicationNo: text(),
    applicationNoTrigramHashes: text().array().notNull().default([]),

    applicationNo: customEncryptedType<string>('text', 'applicationNo').notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }), // User who submitted the application
    year: integer().notNull(), // Financial year of the application
    refundAmount: customEncryptedType<string>('text', 'refundAmount'), // Encrypted refund amount
    commissionPercentage: customEncryptedType<string>('text', 'commissionPercentage'), // Encrypted commission percentage
    commissionAmount: customEncryptedType<string>('text', 'commissionAmount'), // Encrypted commission amount
    vatPercentage: customEncryptedType<string>('text', 'vatPercentage'), // Encrypted VAT percentage
    vatAmount: customEncryptedType<string>('text', 'vatAmount'), // Encrypted VAT amount
    discountAmount: customEncryptedType<string>('text', 'discountAmount'), // Encrypted discount amount
    totalCommissionAmount: customEncryptedType<string>('text', 'totalCommissionAmount'), // Encrypted total commission amount
    finalAmount: customEncryptedType<string>('text', 'finalAmount'), // Encrypted final amount
    isQuestionnaireSubmitted: boolean().default(true), // Whether the questionnaire is submitted
    paymentStatus: paymentStatuses().notNull().default('pending'), // Encrypted payment status
    invoiceId: customEncryptedType<string>('text', 'invoiceId'), // Encrypted invoice ID
    invoiceNo: integer().unique(), // Invoice number
    status: applicationStatuses().notNull().default('draft'), // Application status
    taxReturnDocumentId: uuid().references(() => files.id), // Reference to tax return document file
    taxReturnDocumentUploadedAt: timestamp({ mode: 'date' }), // When tax return document was uploaded
    taxReturnDocumentUploadedBy: uuid().references(() => admins.id), // Admin who uploaded the tax return document

    // Application amendment
    parentId: uuid().references((): AnyPgColumn => applications.id),
    isAmendment: boolean().default(false).notNull(),

    // Payment reminder tracking
    lastPaymentReminderSentAt: timestamp({ mode: 'date' }), // When last payment reminder email was sent

    deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(), // When application was created
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // When application was last updated
    flatFee: customEncryptedType<string>('text', 'flatFee'), // Encrypted flat fee amount
    paymentReminderSentCount: integer().default(0).notNull(), // Number of payment reminders sent
    isJointApplication: boolean().default(false).notNull(),
    automatedSummary: text(), // AI generated summary
    taxReturnSummary: text(), // Finalized/Edited summary
  },
  (t) => [
    // Frequent filters and sorts
    index('applications_user_id_idx').on(t.userId),
    index('applications_user_created_idx').on(t.userId, t.createdAt),
    index('applications_user_year_status_idx').on(t.userId, t.year, t.status),
    index('applications_status_idx').on(t.status),
    index('applications_year_idx').on(t.year),
    index('applications_application_no_idx').on(t.applicationNo),
    index('applications_parent_id_idx').on(t.parentId),
    index('applications_created_at_idx').on(t.createdAt),
    // GIN index for trigram hash array search
    index('applications_application_no_trigram_hashes_idx').using(
      'gin',
      t.applicationNoTrigramHashes
    ),
  ]
);

/**
 * Relations for applications
 * Connects to user, refund document file, and admin who uploaded the document.
 */
export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }), // User who submitted the application
  taxReturnDocument: one(files, {
    fields: [applications.taxReturnDocumentId],
    references: [files.id],
  }), // Tax return document file
  taxReturnDocumentUploadedBy: one(admins, {
    fields: [applications.taxReturnDocumentUploadedBy],
    references: [admins.id],
  }), // Admin who uploaded the tax return document
  parentApplication: one(applications, {
    fields: [applications.parentId],
    references: [applications.id],
  }),
  questionnaireResponse: one(questionnaireResponses),
  applicationStatusHistories: many(applicationStatusHistories),
  applicationDocumentCategories: many(applicationDocumentCategories),
}));
