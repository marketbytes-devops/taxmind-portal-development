import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { admins } from './admins';
import { applications } from './applications';
import { offlinePaymentStatuses, paymentMethods, payments } from './payments';
import { users } from './users';

/**
 * Table: offline_payment_requests
 * Handles offline payment claims that require admin approval
 */
export const offlinePaymentRequests = pgTable('offline_payment_requests', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(), // User who claimed offline payment
  applicationId: uuid()
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(), // Related application

  paymentId: uuid()
    .references(() => payments.id, { onDelete: 'cascade' })
    .unique(), // Links to the main payment record

  // User's Claim Information
  claimedAmount: customEncryptedType<string>('text', 'claimedAmount').notNull(), // Amount user claims to have paid
  claimedPaymentDate: timestamp({ mode: 'date' }).notNull(), // Date when user claims payment was made
  // claimedPaymentMethod: paymentMethods().notNull(), // Payment method claimed by user
  // claimedTransactionId: customEncryptedType<string>('text', 'claimedTransactionId'), // Transaction ID provided by user
  // userNotes: customEncryptedType<string>('text', 'userNotes'), // User's additional notes/proof
  // userDocuments: text(), // JSON array of document IDs uploaded by user as proof

  // Admin Review Information
  status: offlinePaymentStatuses().notNull().default('pending'), // Request status
  reviewedBy: uuid().references(() => admins.id), // Admin who reviewed the request
  reviewedAt: timestamp({ mode: 'date' }), // When request was reviewed

  // Admin's Decision (for approved requests)
  // verifiedAmount: customEncryptedType<string>('text', 'verifiedAmount'), // Amount verified by admin
  verifiedPaymentMethod: paymentMethods(), // Payment method verified by admin
  verifiedTransactionId: customEncryptedType<string>('text', 'verifiedTransactionId'), // Transaction ID verified by admin
  verifiedPaymentDate: timestamp({ mode: 'date' }), // Payment date verified by admin
  // adminNotes: customEncryptedType<string>('text', 'adminNotes'), // Admin's notes about the verification

  // Rejection Information
  rejectionReason: customEncryptedType<string>('text', 'rejectionReason'), // Detailed reason for rejection
  rejectionCategory: text(), // Category of rejection (invalid_proof, amount_mismatch, etc.)
  rejectedDate: customEncryptedType<string>('text', 'rejectedDate'), // Date when user was informed about rejection
  // canResubmit: boolean().default(false), // Whether user can submit a new request

  // Re-approval tracking (for rejected requests that get approved later)
  // previousStatus: offlinePaymentStatuses(), // Previous status before re-approval
  // statusChangedAt: timestamp({ mode: 'date' }), // When status was last changed
  // statusChangedBy: uuid().references(() => admins.id), // Admin who changed the status
  // statusChangeReason: customEncryptedType<string>('text', 'statusChangeReason'), // Reason for status change

  // Request Metadata
  ipAddress: customEncryptedType<string>('text', 'ipAddress').notNull(), // IP address of actor
  userAgent: customEncryptedType<string>('text', 'userAgent').notNull(), // User agent string
  requestId: text().notNull().notNull(), // Unique request ID for tracing

  deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Relations for offline payment requests
 */
export const offlinePaymentRequestsRelations = relations(offlinePaymentRequests, ({ one }) => ({
  payment: one(payments, {
    fields: [offlinePaymentRequests.paymentId],
    references: [payments.id],
  }),
  user: one(users, {
    fields: [offlinePaymentRequests.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [offlinePaymentRequests.applicationId],
    references: [applications.id],
  }),
  reviewedByAdmin: one(admins, {
    fields: [offlinePaymentRequests.reviewedBy],
    references: [admins.id],
  }),
  // statusChangedByAdmin: one(admins, {
  //   fields: [offlinePaymentRequests.statusChangedBy],
  //   references: [admins.id],
  // }),
}));
