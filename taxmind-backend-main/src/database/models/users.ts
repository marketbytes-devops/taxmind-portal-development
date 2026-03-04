import { relations } from 'drizzle-orm';
import { AnyPgColumn, boolean, index, pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { agentActivations } from './agentActivations';
import { chats } from './chats';
import { policies } from './policies';

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),

    // Trigram hashes for partial search (array of hashed trigrams)
    emailTrigramHashes: text().array().notNull().default([]),
    phoneTrigramHashes: text().array().notNull().default([]),
    nameTrigramHashes: text().array().notNull().default([]),
    ppsNumberTrigramHashes: text().array().notNull().default([]),

    // Encrypted sensitive data (PII)
    name: customEncryptedType<string>('text', 'name').notNull(),
    email: customEncryptedType<string>('text', 'email').notNull(),
    phone: customEncryptedType<string>('text', 'phone').notNull(),
    dob: customEncryptedType<string>('text', 'dob').notNull(),
    profession: customEncryptedType<string>('text', 'profession').notNull(),
    ppsNumber: customEncryptedType<string>('text', 'ppsNumber').notNull(),
    address: customEncryptedType<string>('text', 'address').notNull(),
    eircode: customEncryptedType<string>('text', 'eircode').notNull(),
    maritalStatus: customEncryptedType<string>('text', 'maritalStatus').notNull(),

    // Authentication
    password: text(),
    passwordSetAt: customEncryptedType<string>('text', 'passwordSetAt'),
    accessToken: text(),
    refreshToken: text(),

    // Email Verification
    emailOtp: customEncryptedType<string>('text', 'emailOtp'),
    emailOtpExpires: customEncryptedType<string>('text', 'emailOtpExpires'),
    emailVerifiedAt: customEncryptedType<string>('text', 'emailVerifiedAt'),
    isEmailOtpVerified: boolean().default(false).notNull(),

    // Phone verification
    phoneOtp: customEncryptedType<string>('text', 'phoneOtp'),
    phoneOtpExpires: customEncryptedType<string>('text', 'phoneOtpExpires'),
    phoneVerifiedAt: customEncryptedType<string>('text', 'phoneVerifiedAt'),
    isPhoneOtpVerified: boolean().default(false).notNull(),

    // Notification settings
    isEmailNotificationEnabled: boolean().default(true),
    isAppNotificationEnabled: boolean().default(true),
    fcmToken: customEncryptedType<string>('text', 'fcmToken'),

    // Account related fields
    status: boolean().default(true).notNull(),
    isPrimaryAccount: boolean().default(true).notNull(),
    isTaxAgentVerificationCompleted: boolean().default(false),
    taxAgentVerificationCompletedAt: customEncryptedType<string>(
      'text',
      'taxAgentVerificationCompletedAt'
    ),
    isTaxAgentVerificationRequestSent: boolean().default(false),
    taxAgentVerificationRequestSentAt: customEncryptedType<string>(
      'text',
      'taxAgentVerificationRequestSentAt'
    ),
    lastActivityAt: customEncryptedType<string>('text', 'lastActivityAt'),
    parentId: uuid().references((): AnyPgColumn => users.id),
    isSignatureConsentCompleted: boolean().default(false),
    signatureConsentCompletedAt: customEncryptedType<string>('text', 'signatureConsentCompletedAt'),

    // GDPR compliance fields
    deletedAt: timestamp('deleted_at'),

    // Policy consent tracking
    privacyPolicyId: uuid()
      .notNull()
      .references(() => policies.id),
    privacyPolicyAcceptedAt: timestamp(),
    cookiePolicyId: uuid()
      .notNull()
      .references(() => policies.id),
    cookiePolicyAcceptedAt: timestamp(),
    feeStructureId: uuid()
      .notNull()
      .references(() => policies.id),
    feeStructureAcceptedAt: timestamp(),
    termsAndConditionId: uuid()
      .notNull()
      .references(() => policies.id),
    termsAndConditionAcceptedAt: timestamp(),

    // Payment details
    revolutCustomerId: customEncryptedType<string>('text', 'revolutCustomerId'),

    // Audit fields
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    lastAgentActivationReminderSentAt: timestamp({ mode: 'date' }), // When last agent activation reminder was sent
    agentActivationReminderSentCount: integer().default(0).notNull(), // Number of agent activation reminders sent
    remark: text(),
    isReturnUser: boolean().default(false).notNull(),
    returnedAt: timestamp({ mode: 'date' }),
    isJointAssessment: boolean().default(false).notNull(),
  },
  (t) => [
    // GIN indexes for efficient array containment searches (@> operator)
    index('idx_email_trigrams').using('gin', t.emailTrigramHashes),
    index('idx_phone_trigrams').using('gin', t.phoneTrigramHashes),
    index('idx_name_trigrams').using('gin', t.nameTrigramHashes),
    index('idx_pps_trigrams').using('gin', t.ppsNumberTrigramHashes),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  parentUser: one(users, { fields: [users.parentId], references: [users.id] }),
  sentChats: many(chats),
  agentActivation: one(agentActivations),
}));
