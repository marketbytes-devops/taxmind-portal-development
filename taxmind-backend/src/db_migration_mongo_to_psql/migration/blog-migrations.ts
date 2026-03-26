import { eq } from 'drizzle-orm';
import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, models, pool } from '@/database';
import { blogs, files } from '@/database/models';

import defaults from '../default';
import { BlogModel } from '../schema/blog';

// Type definitions for MongoDB Blog document
interface MongoBlog extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  image?: string; // Image path or URL
  content: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  create_date: Date;
  update_date: Date;
  pgBlogId?: string; // Will be added after migration
}

interface MigrationError {
  blogId: string;
  error: string;
  mongoData: Partial<MongoBlog>;
  timestamp: Date;
}

// Configuration
class BlogMigrationConfig {
  public mongoUri: string;
  public mongoDbName: string;
  public pgConnectionString: string;

  constructor() {
    // Use MongoDB URI from defaults.js or environment variables
    this.mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DEV || defaults.MONGO_URI_DEV;

    // Extract database name from URI or use environment variable
    this.mongoDbName =
      process.env.MONGO_DB_NAME || this.extractDbNameFromUri(this.mongoUri) || 'TaxMindDB_Test';

    this.pgConnectionString = process.env.DATABASE_URL;

    if (!this.pgConnectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    if (!this.mongoUri) {
      throw new Error(
        'MongoDB URI is required. Set MONGO_URI or MONGO_URI_DEV environment variable.'
      );
    }
  }

  // Extract database name from MongoDB URI
  private extractDbNameFromUri(uri: string): string | null {
    try {
      const match = uri.match(/\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

// Migration Statistics
class BlogMigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public imagesProcessed: number = 0;
  public activeRecords: number = 0;
  public inactiveRecords: number = 0;
  public deletedRecords: number = 0;
  public publishedBlogs: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    blogId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoBlog> = {}
  ): void {
    this.errors.push({
      blogId: blogId.toString(),
      error: error instanceof Error ? error.message : String(error),
      mongoData,
      timestamp: new Date(),
    });
    this.failedMigrations++;
  }

  addSuccess(): void {
    this.successfulMigrations++;
  }

  addSkipped(): void {
    this.skippedRecords++;
  }

  addImage(): void {
    this.imagesProcessed++;
  }

  addActive(): void {
    this.activeRecords++;
  }

  addInactive(): void {
    this.inactiveRecords++;
  }

  addDeleted(): void {
    this.deletedRecords++;
  }

  addPublished(): void {
    this.publishedBlogs++;
  }

  getSuccessRate(): string {
    if (this.totalRecords === 0) return '0.00';
    return ((this.successfulMigrations / this.totalRecords) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Blog Migration Class
class BlogMigrator {
  private config: BlogMigrationConfig;
  private stats: BlogMigrationStats;
  private superAdminId: string | null = null;

  constructor(config: BlogMigrationConfig) {
    this.config = config;
    this.stats = new BlogMigrationStats();
  }

  async connect(): Promise<void> {
    try {
      // Connect to MongoDB using Mongoose
      await mongoose.connect(this.config.mongoUri);
      console.log('✅ Connected to MongoDB successfully via Mongoose');

      // Test PostgreSQL connection using shared pool
      const pgClient: PoolClient = await pool.connect();
      pgClient.release();
      console.log('✅ Connected to PostgreSQL successfully');
    } catch (error) {
      console.error('❌ Failed to establish database connections:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('📡 Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Get or create super admin as the default author for blogs
  private async getSuperAdminId(): Promise<string> {
    if (this.superAdminId) return this.superAdminId;

    try {
      // Find super admin in PostgreSQL
      const superAdminRole = await db.query.roles.findFirst({
        where: eq(models.roles.roleName, 'Super Admin'),
      });

      const superAdmin = await db.query.admins.findFirst({
        where: eq(models.admins.roleId, superAdminRole!?.id),
        columns: { id: true },
      });

      if (!superAdmin) {
        throw new Error('Super admin not found in PostgreSQL database');
      }

      this.superAdminId = superAdmin.id;
      console.log('✅ Found super admin ID for blog authorship:', this.superAdminId);
      return this.superAdminId;
    } catch (error) {
      console.error('❌ Failed to get super admin ID:', error);
      throw error;
    }
  }

  // Insert image file into PostgreSQL files table
  private async insertImageFile(imagePath: string, blogTitle: string): Promise<string | null> {
    try {
      if (!imagePath) return null;

      // Extract filename from path
      const fileName =
        imagePath.split('/').pop() || `${blogTitle.toLowerCase().replace(/\s+/g, '-')}-image`;

      const [fileRecord] = await db
        .insert(files)
        .values({
          key: imagePath,
          fileName: fileName,
          mimeType: this.getMimeTypeFromFileName(fileName),
          fileSize: '0', // Size not available from MongoDB schema
          fileType: 'image', // Blog images
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: files.id });

      this.stats.addImage();
      return fileRecord.id;
    } catch (error) {
      console.error('Failed to insert blog image file:', error);
      return null;
    }
  }

  // Helper method to determine MIME type from file name
  private getMimeTypeFromFileName(fileName: string): string {
    if (!fileName) return 'image/jpeg'; // Default for blog images

    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
    };

    return mimeTypes[ext || ''] || 'image/jpeg';
  }

  // Helper method to generate excerpt from content
  private generateExcerpt(content: string, maxLength: number = 200): string {
    if (!content) return '';

    // Remove HTML tags if present
    const textOnly = content.replace(/<[^>]*>/g, '');

    // Truncate to max length and ensure we don't cut off in the middle of a word
    if (textOnly.length <= maxLength) return textOnly;

    const truncated = textOnly.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  // Helper method to estimate reading time
  private calculateReadingTime(content: string): string {
    if (!content) return '1';

    const wordsPerMinute = 200; // Average reading speed
    const textOnly = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const wordCount = textOnly.split(/\s+/).filter((word) => word.length > 0).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return Math.max(1, minutes).toString(); // Minimum 1 minute
  }

  // Helper method to generate SEO-friendly slug if needed
  private generateSlugFromTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  // Insert blog into PostgreSQL using Drizzle ORM
  private async insertBlog(mongoBlog: MongoBlog): Promise<void> {
    try {
      // Get super admin as default author
      const authorId = await this.getSuperAdminId();

      // Handle image file
      let imageId: string | null = null;
      if (mongoBlog.image) {
        imageId = await this.insertImageFile(mongoBlog.image, mongoBlog.title);
      }

      // Map status from MongoDB to PostgreSQL
      const isActive = mongoBlog.status === 'ACTIVE';
      const isDeleted = mongoBlog.status === 'DELETED';

      // For active blogs, consider them published
      const isPublished = isActive;
      const publishedAt = isPublished ? mongoBlog.create_date : null;

      // Update stats based on status
      if (isDeleted) {
        this.stats.addDeleted();
      } else if (isActive) {
        this.stats.addActive();
        this.stats.addPublished();
      } else {
        this.stats.addInactive();
      }

      // Generate additional fields not present in MongoDB
      const excerpt = this.generateExcerpt(mongoBlog.content);
      const readingTime = this.calculateReadingTime(mongoBlog.content);
      const slug = mongoBlog.slug || this.generateSlugFromTitle(mongoBlog.title);

      // Insert blog record
      const [blogRecord] = await db
        .insert(blogs)
        .values({
          title: mongoBlog.title,
          slug: slug,
          excerpt: excerpt,
          content: mongoBlog.content,
          imageId,
          imageAlt: mongoBlog.title, // Use title as alt text fallback
          status: isActive,
          isPublished,
          publishedAt,
          authorId,

          // SEO fields - using existing content as defaults
          seoTitle: mongoBlog.title,
          seoDescription: excerpt,
          seoKeywords: null, // Not available in MongoDB schema
          canonicalUrl: null, // Not available in MongoDB schema

          // Analytics and engagement
          viewCount: '0',
          readingTimeMinutes: readingTime,

          // Feature flags
          isFeatured: false,
          featuredOrder: '0',

          deletedAt: isDeleted ? mongoBlog.update_date : null,
          createdAt: mongoBlog.create_date || new Date(),
          updatedAt: mongoBlog.update_date || new Date(),
        })
        .returning({ id: blogs.id });

      console.log(`✅ Inserted blog "${mongoBlog.title}" with ID: ${blogRecord.id}`);

      // Update MongoDB record with PostgreSQL ID
      await BlogModel.updateOne({ _id: mongoBlog._id }, { $set: { pgBlogId: blogRecord.id } });
    } catch (error) {
      console.error('Drizzle blog insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateBlogs(): Promise<void> {
    try {
      // Get super admin ID first
      await this.getSuperAdminId();

      // Get total blog count
      this.stats.totalRecords = await BlogModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} blog records`);
      console.log('📊 Progress will be logged every 10 records...\n');

      // Use Mongoose cursor for better memory efficiency
      const cursor = BlogModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating blogs...');

      for (
        let mongoBlog = await cursor.next();
        mongoBlog != null;
        mongoBlog = await cursor.next()
      ) {
        processedCount++;

        try {
          // Skip blogs without essential data
          if (!mongoBlog.title || !mongoBlog.content) {
            console.warn(`⚠️  Skipping blog ${mongoBlog._id}: Missing title or content`);
            this.stats.addSkipped();
            continue;
          }

          // Generate slug if missing
          if (!mongoBlog.slug) {
            mongoBlog.slug = this.generateSlugFromTitle(mongoBlog.title);
          }

          await this.insertBlog(mongoBlog as any);
          this.stats.addSuccess();

          // Log progress every 10 records
          if (processedCount % 10 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} blogs (${this.stats.successfulMigrations} successful, ${this.stats.publishedBlogs} published, ${this.stats.imagesProcessed} images)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to migrate blog ${mongoBlog._id}:`, (error as Error).message);
          this.stats.addError(mongoBlog._id as mongoose.Types.ObjectId, error as Error, {
            title: mongoBlog.title as string,
            slug: mongoBlog.slug as string,
            status: mongoBlog.status,
            content: mongoBlog.content?.substring(0, 100) + '...',
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Blog migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`📝 Published Blogs: ${this.stats.publishedBlogs}`);
    console.log(`🟢 Active Records: ${this.stats.activeRecords}`);
    console.log(`🟡 Inactive Records: ${this.stats.inactiveRecords}`);
    console.log(`🔴 Deleted Records: ${this.stats.deletedRecords}`);
    console.log(`🖼️  Images Processed: ${this.stats.imagesProcessed}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. Blog ${error.blogId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify blog content formatting and HTML structure');
    console.log('2. Test blog display and image loading functionality');
    console.log('3. Validate SEO fields and meta descriptions');
    console.log('4. Check slug uniqueness and URL generation');
    console.log('5. Review reading time calculations and excerpts');
    console.log('6. Consider updating SEO keywords and canonical URLs manually');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateBlogs();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runBlogMigration(): Promise<boolean> {
  try {
    const config = new BlogMigrationConfig();

    console.log('🎯 Starting Blog Migration from MongoDB to PostgreSQL...');
    console.log('📰 Migrating blogs with image file references and SEO enhancements...');
    console.log('📋 Configuration Source:');

    // Show configuration source
    if (process.env.MONGO_URI) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI)');
    } else if (process.env.MONGO_URI_DEV) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI_DEV)');
    } else {
      console.log('   MongoDB URI: Default configuration (default.js)');
    }

    console.log(`📡 MongoDB URI: ${config.mongoUri.replace(/\/\/.*@/, '//***@')}`);
    console.log(`🗄️  MongoDB Database: ${config.mongoDbName}`);
    console.log(`🐘 PostgreSQL: Connected\n`);

    const migrator = new BlogMigrator(config);
    await migrator.run();

    console.log('🎉 Blog migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Blog migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { BlogMigrator, BlogMigrationConfig, runBlogMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runBlogMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
