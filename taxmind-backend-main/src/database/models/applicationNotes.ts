import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { applications } from './applications';

/**
 * Table: application_notes
 * Stores notes added by admins to user applications for audit and communication purposes.
 */
export const applicationNotes = pgTable(
  'application_notes',
  {
    id: uuid().defaultRandom().primaryKey().notNull(), // Unique note ID
    adminId: uuid()
      .notNull()
      .references(() => admins.id), // Admin who created the note
    applicationId: uuid()
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }), // Associated application
    note: text().notNull(), // Note content (plain text)

    // Audit fields
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(), // When note was created
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // When note was last updated
    deletedAt: timestamp({ mode: 'date' }), // Soft delete timestamp
  },
  (t) => [
    index().on(t.adminId), // Index for admin lookups
    index().on(t.applicationId), // Index for application lookups
    index().on(t.createdAt), // Index for sorting/filtering by creation date
  ]
);

/**
 * Relations for application_notes
 * Connects to admin and application tables.
 */
export const applicationNotesRelations = relations(applicationNotes, ({ one }) => ({
  admin: one(admins, {
    fields: [applicationNotes.adminId],
    references: [admins.id],
  }), // Admin who created the note
  application: one(applications, {
    fields: [applicationNotes.applicationId],
    references: [applications.id],
  }), // Application to which the note belongs
}));
