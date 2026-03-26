import { integer, pgTable, real, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const siteContents = pgTable('site_contents', {
  homeTitle: text().notNull(),
  homeContent: text().notNull(),
  headerEmail: varchar({ length: 20 }).notNull(),
  headerPhone: varchar({ length: 20 }).notNull(),
  aboutUsContent: text().notNull(),
  commissionPercentage: real().notNull(),
  vaPercentage: real().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
