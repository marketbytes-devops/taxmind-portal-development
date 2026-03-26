import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { applications } from './applications';
import { applicationStatuses } from './enums';

export const applicationStatusHistories = pgTable(
  'application_status_histories',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    status: applicationStatuses().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
  },
  (t) => [index().on(t.applicationId)]
);

export const applicationStatusHistoriesRelations = relations(
  applicationStatusHistories,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistories.applicationId],
      references: [applications.id],
    }),
  })
);
