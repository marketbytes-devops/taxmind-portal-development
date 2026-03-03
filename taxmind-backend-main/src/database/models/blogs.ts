import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { admins } from './admins';
import { files } from './files';

export const blogs = pgTable(
  'blogs',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull().unique(),
    excerpt: text(), // Short description for previews
    content: text().notNull(),
    imageId: uuid().references(() => files.id), // Reference to files table for featured image
    imageAlt: varchar({ length: 255 }), // Alt text for featured image
    status: boolean().default(true).notNull(), // true = published, false = draft
    isPublished: boolean().default(false).notNull(), // Published status
    publishedAt: timestamp({ mode: 'date' }), // Publication date
    authorId: uuid().notNull(), // Admin who created the blog

    // SEO fields
    seoTitle: varchar({ length: 255 }), // Custom SEO title (if different from title)
    seoDescription: text(), // Meta description for search engines
    seoKeywords: text(), // Keywords for SEO
    canonicalUrl: varchar({ length: 500 }), // Canonical URL to prevent duplicate content

    // Analytics and engagement
    viewCount: varchar({ length: 15 }).default('0'), // Track blog views
    readingTimeMinutes: varchar({ length: 5 }), // Estimated reading time

    // Feature flags
    isFeatured: boolean().default(false).notNull(), // Featured blog for homepage
    featuredOrder: varchar({ length: 5 }).default('0'), // Order for featured blogs

    deletedAt: timestamp({ mode: 'date' }),
    createdAt: timestamp({ mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('blogs_slug_idx').on(t.slug),
    index('blogs_status_idx').on(t.status),
    index('blogs_published_idx').on(t.isPublished),
    index('blogs_author_idx').on(t.authorId),
    index('blogs_featured_idx').on(t.isFeatured),
    index('blogs_published_at_idx').on(t.publishedAt),
  ]
);

export const blogsRelations = relations(blogs, ({ one }) => ({
  author: one(admins, {
    fields: [blogs.authorId],
    references: [admins.id],
  }),
  image: one(files, {
    fields: [blogs.imageId],
    references: [files.id],
  }),
}));
