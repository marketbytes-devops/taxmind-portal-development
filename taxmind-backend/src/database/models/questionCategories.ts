import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { files } from './files';
import { questionnaires } from './questionnaires';
import { questions } from './questions';

// Question Categories
export const questionCategories = pgTable(
  'question_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionnaireId: uuid('questionnaire_id')
      .references(() => questionnaires.id)
      .notNull(),

    // Category details
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    iconId: uuid('icon_id').references(() => files.id),

    // Ordering and display
    sortOrder: integer('sort_order').notNull().default(0),

    // Audit fields
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_questionnaire_id').on(t.questionnaireId),
    index('question_categories_sort_order_idx').on(t.sortOrder),
  ]
);

// Relations
export const questionCategoriesRelations = relations(questionCategories, ({ one, many }) => ({
  questionnaire: one(questionnaires, {
    fields: [questionCategories.questionnaireId],
    references: [questionnaires.id],
  }),
  icon: one(files, {
    fields: [questionCategories.iconId],
    references: [files.id],
  }),
  questions: many(questions),
  // Note: questions relation will be added when questions model is imported
  // questions: many(questions),
}));
