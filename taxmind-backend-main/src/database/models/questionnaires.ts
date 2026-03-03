import { eq, relations, sql } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { questionCategories } from './questionCategories';
import { questionnaireResponses } from './questionnaireResponses';

export const questionnaireStatusEnum = pgEnum('questionnaire_status', [
  'draft',
  'published',
  'archived',
]);

// Yearly Tax Questionnaires
export const questionnaires = pgTable(
  'questionnaires',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Year and basic info
    taxYear: integer('tax_year').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),

    // Version control for updates
    version: integer('version').notNull().default(1),

    // Status management
    status: questionnaireStatusEnum('status').notNull().default('draft'),
    importedFrom: integer('imported_from'),

    // Publishing dates
    publishedAt: timestamp('published_at'),
    publishedBy: uuid('published_by').references(() => admins.id),

    // Audit fields
    createdBy: uuid('created_by')
      .references(() => admins.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.taxYear, t.version),
    uniqueIndex()
      .on(t.taxYear)
      .where(eq(t.status, sql`'published'`)),
  ]
);

// Relations
export const questionnairesRelations = relations(questionnaires, ({ one, many }) => ({
  createdByUser: one(admins, {
    fields: [questionnaires.createdBy],
    references: [admins.id],
    relationName: 'questionnaire_created_by',
  }),
  publishedByUser: one(admins, {
    fields: [questionnaires.publishedBy],
    references: [admins.id],
    relationName: 'questionnaire_published_by',
  }),
  questionnaireResponses: many(questionnaireResponses),
  questionCategories: many(questionCategories),
}));
