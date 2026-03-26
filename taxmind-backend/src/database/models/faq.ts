import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const faqs = pgTable('faqs', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  question: text().notNull(),
  answer: text().notNull(),
  status: boolean().default(true),
  deletedAt: timestamp({ mode: 'date' }),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
