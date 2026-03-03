import { eq, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { policyTypesArr } from '@/constants';

export const policyTypes = pgEnum('policy_types', policyTypesArr as TPgEnum);

export const policies = pgTable(
  'policies',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    policyNo: integer().notNull(),
    type: policyTypes().notNull(),
    content: text().notNull(),
    version: varchar({ length: 20 }).notNull(),
    effectiveDate: timestamp({ mode: 'date' }).notNull(),
    isActive: boolean().notNull().default(false),
    deletedAt: timestamp({ mode: 'date' }),
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex().on(t.type, t.policyNo),
    uniqueIndex()
      .on(t.type)
      .where(eq(t.isActive, sql`true`)),
  ]
);
