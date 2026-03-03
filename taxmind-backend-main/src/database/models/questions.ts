import { relations } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { questionCategories } from './questionCategories';
import { questionnaires } from './questionnaires';

// Enums for type safety
export const questionTypeEnum = pgEnum('question_type', [
  'text',
  'dropdown',
  'radio',
  'date',
  // 'number',
  // 'boolean',
  // 'checkbox',
  // 'file_upload',
]);

// Master Question table (reusable)
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    questionnaireId: uuid('questionnaire_id')
      .references(() => questionnaires.id)
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => questionCategories.id)
      .notNull(),

    // Question content
    questionText: text('question_text').notNull(),
    helpText: text('help_text'),
    placeholder: varchar('placeholder', { length: 255 }),

    // Question type and validation
    questionType: questionTypeEnum('question_type').notNull(),
    isRequired: boolean('is_required').default(false).notNull(),

    // Display properties
    sortOrder: integer('sort_order').notNull().default(0),

    // Options for dropdown/radio questions. Extended shape supports optional per-option document categories:
    // [
    //   { value: 'married', label: 'Married', order: 1, documentCategoryId: string, isDocumentRequired: boolean }
    // ]
    // documentCategoryId is optional and allows attaching one document category per option
    options: jsonb('options'),

    // // Validation rules (JSON schema)
    // validationRules: jsonb('validation_rules'),

    // // Conditional logic
    // showConditions: jsonb('show_conditions'), // When to show this question. e.g. { equals: true }

    // Hierarchical structure for child questions
    parentQuestionId: uuid('parent_question_id').references((): AnyPgColumn => questions.id),
    showIfParentOptionValue: varchar('show_if_parent_option_value', { length: 255 }), // e.g. 'yes'

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('questions_questionnaire_id_idx').on(t.questionnaireId),
    index('questions_category_id_idx').on(t.categoryId),
    index('questions_parent_question_id_idx').on(t.parentQuestionId),
    index('questions_sort_order_idx').on(t.sortOrder),
  ]
);

// Relations
export const questionsRelations = relations(questions, ({ one }) => ({
  questionnaire: one(questionnaires, {
    fields: [questions.questionnaireId],
    references: [questionnaires.id],
  }),
  category: one(questionCategories, {
    fields: [questions.categoryId],
    references: [questionCategories.id],
  }),
  parentQuestion: one(questions, {
    fields: [questions.parentQuestionId],
    references: [questions.id],
    relationName: 'question_parent',
  }),
  // Note: responses relation will be added when questionResponses model is imported
  // responses: many(questionResponses),
}));
