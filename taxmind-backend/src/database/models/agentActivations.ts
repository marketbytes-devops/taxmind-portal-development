import { relations } from 'drizzle-orm';
import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';
import { users } from './users';

export const agentActivations = pgTable(
  'agent_activations',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    noticeNo: customEncryptedType<string>('text', 'noticeNo'),
    customerName: customEncryptedType<string>('text', 'customerName'),
    regnTraderNo: customEncryptedType<string>('text', 'regnTraderNo').notNull(),
    documentType: customEncryptedType<string>('text', 'documentType').notNull(),
    issuedDate: customEncryptedType<string>('text', 'issuedDate').notNull(),
    mandatoryEFiler: customEncryptedType<string>('text', 'mandatoryEFiler'),
    periodBegin: customEncryptedType<string>('text', 'periodBegin'),
    taxTypeDutyReport: customEncryptedType<string>('text', 'taxTypeDutyReport'),
    archivedBy: customEncryptedType<string>('text', 'archivedBy'),
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
  },
  (t) => ({
    agentActivationUserIdx: index().on(t.userId),
  })
);

export const agentActivationsRelations = relations(agentActivations, ({ one }) => ({
  user: one(users, {
    fields: [agentActivations.userId],
    references: [users.id],
  }),
}));
