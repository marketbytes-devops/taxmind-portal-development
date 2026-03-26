import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { questionnaireResponses } from './questionnaireResponses';
import { questions } from './questions';

// Individual Question Responses
export const questionResponses = pgTable(
  'question_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionnaireResponseId: uuid('questionnaire_response_id')
      .references(() => questionnaireResponses.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: uuid('question_id')
      .references(() => questions.id)
      .notNull(),

    // Response value (encrypted for sensitive data)
    value: customEncryptedType<string>('text', 'value'),

    // File upload support
    // fileMetadata: jsonb('file_metadata'), // {filepath, filename, size, mimeType, uploadedAt}

    // Response metadata
    answeredAt: timestamp('answered_at').defaultNow(),

    // GDPR compliance
    deletedAt: timestamp('deleted_at'),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('question_responses_questionnaire_response_id_idx').on(table.questionnaireResponseId),
    index('question_responses_question_id_idx').on(table.questionId),
    index('question_responses_answered_at_idx').on(table.answeredAt),
    index('question_responses_deleted_at_idx').on(table.deletedAt),
    // Ensure one response per question per questionnaire response
    unique().on(table.questionnaireResponseId, table.questionId),
  ]
);

// Relations
export const questionResponsesRelations = relations(questionResponses, ({ one }) => ({
  questionnaireResponse: one(questionnaireResponses, {
    fields: [questionResponses.questionnaireResponseId],
    references: [questionnaireResponses.id],
  }),
  question: one(questions, {
    fields: [questionResponses.questionId],
    references: [questions.id],
  }),
}));
