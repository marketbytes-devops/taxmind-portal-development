import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { offlinePaymentStatusesArr, paymentMethodsArr, paymentStatusesArr } from '@/constants';

import { customEncryptedType } from '../utils/customTypes';
import { applications } from './applications';
import { users } from './users';

/**
 * Payment Methods Enum
 * Defines available payment methods
 */
export const paymentMethods = pgEnum('payment_methods', paymentMethodsArr as TPgEnum);

/**
 * Payment Status Enum
 * Tracks the status of payment throughout its lifecycle
 */
export const paymentStatuses = pgEnum('payment_statuses', paymentStatusesArr as TPgEnum);

/**
 * Offline Payment Request Status Enum
 * Tracks the admin approval workflow for offline payments
 */
export const offlinePaymentStatuses = pgEnum(
  'offline_payment_request_statuses',
  offlinePaymentStatusesArr as TPgEnum
);

/**
 * Table: payments
 * Main payment records for applications
 */
export const payments = pgTable('payments', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  applicationId: uuid()
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' })
    .unique(), // Each application can have only one payment record

  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // User making the payment

  // Payment Details
  amount: customEncryptedType<string>('text', 'amount'), // Encrypted payment amount
  currency: text().notNull().default('EUR'), // Payment currency (EUR for Ireland)
  paymentMethod: paymentMethods().notNull(), // Payment method used
  status: paymentStatuses().notNull().default('pending'), // Payment status

  transactionId: customEncryptedType<string>('text', 'transactionId'),
  transactionNo: customEncryptedType<string>('text', 'transactionNo').notNull(),

  // Payment Metadata
  metadata: customEncryptedType<object>('text', 'metadata'),

  // Failure/Error Information
  failureReason: customEncryptedType<string>('text', 'failureReason'), // Reason for payment failure
  errorCode: text(), // Error code from payment processor
  errorMessage: customEncryptedType<string>('text', 'errorMessage'), // Error message

  // Audit Fields
  processedAt: timestamp({ mode: 'date' }), // When payment was processed/completed

  deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Relations for payments
 */
export const paymentsRelations = relations(payments, ({ one }) => ({
  application: one(applications, {
    fields: [payments.applicationId],
    references: [applications.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));
