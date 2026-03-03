import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { files } from './files';

export const carouselImages = pgTable('carousel_images', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  imageId: uuid()
    .references(() => files.id)
    .notNull(), // Reference to files table
  createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
});

export const carouselImagesRelations = relations(carouselImages, ({ one }) => ({
  image: one(files, {
    fields: [carouselImages.imageId],
    references: [files.id],
  }),
}));
