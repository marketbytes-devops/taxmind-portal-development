import { relations } from 'drizzle-orm';
import { index, integer, pgEnum, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { applications } from './applications';
import { questionCategories } from './questionCategories';
import { questionResponses } from './questionResponses';
import { questionnaires } from './questionnaires';

export const responseStatusEnum = pgEnum('response_status', [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
]);

// User Questionnaire Responses
export const questionnaireResponses = pgTable(
  'questionnaire_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionnaireId: uuid('questionnaire_id')
      .references(() => questionnaires.id)
      .notNull(),
    applicationId: uuid('application_id')
      .references(() => applications.id, { onDelete: 'cascade' })
      .notNull(),

    // Response status and tracking
    status: responseStatusEnum('status').notNull().default('draft'),

    // Progress tracking
    completionPercentage: integer('completion_percentage').default(0),
    currentCategoryId: uuid('current_category_id').references(() => questionCategories.id),
    completedCategories: text().array().notNull().default([]),

    // Submission tracking
    submittedAt: timestamp('submitted_at'),
    reviewedAt: timestamp('reviewed_at'),
    reviewedBy: uuid('reviewed_by').references(() => admins.id, { onDelete: 'set null' }),

    // GDPR compliance
    deletedAt: timestamp('deleted_at'),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('questionnaire_responses_user_questionnaire_idx').on(
      table.applicationId,
      table.questionnaireId
    ),
    index('questionnaire_responses_status_idx').on(table.status),
    index('questionnaire_responses_submitted_at_idx').on(table.submittedAt),
    index('questionnaire_responses_deleted_at_idx').on(table.deletedAt),
    // Ensure one response per application per questionnaire
    unique().on(table.applicationId, table.questionnaireId),
  ]
);

// Relations
export const questionnaireResponsesRelations = relations(
  questionnaireResponses,
  ({ one, many }) => ({
    questionnaire: one(questionnaires, {
      fields: [questionnaireResponses.questionnaireId],
      references: [questionnaires.id],
    }),
    application: one(applications, {
      fields: [questionnaireResponses.applicationId],
      references: [applications.id],
    }),
    currentCategory: one(questionCategories, {
      fields: [questionnaireResponses.currentCategoryId],
      references: [questionCategories.id],
    }),
    reviewedByUser: one(admins, {
      fields: [questionnaireResponses.reviewedBy],
      references: [admins.id],
    }),

    questionResponses: many(questionResponses),
  })
);
