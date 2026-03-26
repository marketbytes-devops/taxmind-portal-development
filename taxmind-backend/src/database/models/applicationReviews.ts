import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { applications } from './applications';

export const applicationReviewStatuses = pgEnum('application_review_statuses', [
  'pending',
  'approved',
  'rejected',
]);

export const applicationReviews = pgTable('application_reviews', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  applicationId: uuid()
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  rating: customEncryptedType<string>('text', 'rating'),
  review: customEncryptedType<string>('text', 'review'),
  status: applicationReviewStatuses().notNull().default('pending'), // pending, approved, rejected
  deletedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const applicationReviewsRelations = relations(applicationReviews, ({ one }) => ({
  application: one(applications, {
    fields: [applicationReviews.applicationId],
    references: [applications.id],
  }),
}));
