import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { files } from './files';

export const socialMedias = pgTable('social_medias', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  platform: varchar({ length: 255 }),
  iconId: uuid().references(() => files.id), // Reference to files table for icon
  url: text(),
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
});

export const socialMediasRelations = relations(socialMedias, ({ one }) => ({
  icon: one(files, {
    fields: [socialMedias.iconId],
    references: [files.id],
  }),
}));
