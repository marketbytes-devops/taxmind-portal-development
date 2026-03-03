import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { policies } from './policies';
import { users } from './users';

export const userPolicyAcceptances = pgTable(
  'user_policy_acceptances',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid().references(() => users.id, { onDelete: 'cascade' }),
    policyId: uuid().references(() => policies.id),
    acceptedAt: timestamp().defaultNow().notNull(),
    ip: varchar({ length: 50 }),
    userAgent: varchar({ length: 50 }),
  },
  (t) => [index().on(t.userId), index().on(t.policyId)]
);

export const userPolicyAcceptancesRelations = relations(userPolicyAcceptances, ({ one }) => ({
  policy: one(policies, {
    fields: [userPolicyAcceptances.policyId],
    references: [policies.id],
  }),
  user: one(users, {
    fields: [userPolicyAcceptances.userId],
    references: [users.id],
  }),
}));
