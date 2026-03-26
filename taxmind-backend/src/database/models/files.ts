import { index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { customEncryptedType } from '../utils/customTypes';

// Postgres enum for file status lifecycle
export const fileStatusEnum = pgEnum('file_status', ['pending', 'active', 'failed', 'deleted']);

// Files uploaded to S3 with encryption-at-rest for PII-aligned metadata
export const files = pgTable(
  'files',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    // File category for filtering: e.g., 'image', 'document', 'icon'
    fileType: varchar({ length: 100 }),

    // Searchable hash (HMAC) for lookups; the raw key is encrypted below
    hashedKey: text(),

    // S3 object key (encrypted at rest); unique to avoid duplicates
    key: customEncryptedType<string>('text', 'key').notNull().unique(),

    // Original file name (encrypted)
    fileName: customEncryptedType<string>('text', 'file_name'),

    // MIME type from S3 (encrypted)
    mimeType: customEncryptedType<string>('text', 'mime_type'),

    // File size in bytes (encrypted)
    fileSize: customEncryptedType<string>('text', 'file_size'),

    // Enum-backed status for stronger typing and query performance
    status: fileStatusEnum('status').default('pending').notNull(),

    // Uploader identifiers
    uploadedBy: uuid(), // User ID (nullable for anonymous uploads)
    uploaderType: varchar({ length: 10 }), // 'admin' or 'user'

    // Actual upload time captured from storage provider (encrypted)
    uploadedAt: customEncryptedType<string>('text', 'uploaded_at'),

    // Audit fields
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(), // Signed URL generation time
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    // Pragmatic indexes for frequent access patterns
    index('idx_files_hashed_key').on(t.hashedKey),
    index('idx_files_status').on(t.status),
    index('idx_files_uploaded_by_created').on(t.uploadedBy, t.createdAt),
    index('idx_files_file_type').on(t.fileType),
    index('idx_files_created_at').on(t.createdAt),
  ]
);
