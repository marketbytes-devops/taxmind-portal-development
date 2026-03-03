import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, pool } from '@/database';
import { documentCategories } from '@/database/models';

import defaults from '../default';
import { DocumentCategoryModel } from '../schema/document-category';

// Type definitions for MongoDB DocumentCategory document
interface MongoDocumentCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  create_date: Date;
  update_date: Date;
  pgDocumentCategoryId?: string; // Will be added after migration
}

interface MigrationError {
  documentCategoryId: string;
  error: string;
  mongoData: Partial<MongoDocumentCategory>;
  timestamp: Date;
}

// Configuration
class DocumentCategoryMigrationConfig {
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
class DocumentCategoryMigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public activeRecords: number = 0;
  public inactiveRecords: number = 0;
  public deletedRecords: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    documentCategoryId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoDocumentCategory> = {}
  ): void {
    this.errors.push({
      documentCategoryId: documentCategoryId.toString(),
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

  addActive(): void {
    this.activeRecords++;
  }

  addInactive(): void {
    this.inactiveRecords++;
  }

  addDeleted(): void {
    this.deletedRecords++;
  }

  getSuccessRate(): string {
    if (this.totalRecords === 0) return '0.00';
    return ((this.successfulMigrations / this.totalRecords) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Document Category Migration Class
class DocumentCategoryMigrator {
  private config: DocumentCategoryMigrationConfig;
  private stats: DocumentCategoryMigrationStats;

  constructor(config: DocumentCategoryMigrationConfig) {
    this.config = config;
    this.stats = new DocumentCategoryMigrationStats();
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

  // Insert document category into PostgreSQL using Drizzle ORM
  private async insertDocumentCategory(
    mongoDocumentCategory: MongoDocumentCategory
  ): Promise<void> {
    try {
      // Map status from MongoDB to PostgreSQL
      const isDeleted = mongoDocumentCategory.status === 'DELETED';

      // Update stats based on status
      if (isDeleted) {
        this.stats.addDeleted();
      } else if (mongoDocumentCategory.status === 'ACTIVE') {
        this.stats.addActive();
      } else {
        this.stats.addInactive();
      }

      // Insert document category record
      const [documentCategoryRecord] = await db
        .insert(documentCategories)
        .values({
          name: mongoDocumentCategory.name,
          description: null, // No description field in MongoDB schema
          deletedAt: isDeleted ? mongoDocumentCategory.update_date : null,
          createdAt: mongoDocumentCategory.create_date || new Date(),
          updatedAt: mongoDocumentCategory.update_date || new Date(),
        })
        .returning({ id: documentCategories.id });

      console.log(
        `✅ Inserted document category "${mongoDocumentCategory.name}" with ID: ${documentCategoryRecord.id}`
      );

      // Update MongoDB record with PostgreSQL ID
      await DocumentCategoryModel.updateOne(
        { _id: mongoDocumentCategory._id },
        { $set: { pgDocumentCategoryId: documentCategoryRecord.id } }
      );
    } catch (error) {
      console.error('Drizzle document category insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateDocumentCategories(): Promise<void> {
    try {
      // Get total document category count
      this.stats.totalRecords = await DocumentCategoryModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} document category records`);
      console.log('📊 Progress will be logged every 10 records...\n');

      // Use Mongoose cursor for better memory efficiency
      const cursor = DocumentCategoryModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating document categories...');

      for (
        let mongoDocumentCategory = await cursor.next();
        mongoDocumentCategory != null;
        mongoDocumentCategory = await cursor.next()
      ) {
        processedCount++;

        try {
          // Skip document categories without essential data
          if (!mongoDocumentCategory.name) {
            console.warn(
              `⚠️  Skipping document category ${mongoDocumentCategory._id}: Missing name`
            );
            this.stats.addSkipped();
            continue;
          }

          await this.insertDocumentCategory(mongoDocumentCategory as any);
          this.stats.addSuccess();

          // Log progress every 10 records
          if (processedCount % 10 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} document categories (${this.stats.successfulMigrations} successful)`
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to migrate document category ${mongoDocumentCategory._id}:`,
            (error as Error).message
          );
          this.stats.addError(
            mongoDocumentCategory._id as mongoose.Types.ObjectId,
            error as Error,
            {
              name: mongoDocumentCategory.name as string,
              status: mongoDocumentCategory.status,
            }
          );
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Document category migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DOCUMENT CATEGORY MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`🟢 Active Records: ${this.stats.activeRecords}`);
    console.log(`🟡 Inactive Records: ${this.stats.inactiveRecords}`);
    console.log(`🔴 Deleted Records: ${this.stats.deletedRecords}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(
          `  ${index + 1}. Document Category ${error.documentCategoryId}: ${error.error}`
        );
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify document category names and uniqueness');
    console.log('2. Add descriptions to document categories if needed');
    console.log('3. Test document category functionality in the application');
    console.log('4. Update any references to document categories in other modules');
    console.log('5. Consider adding validation rules for category names');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateDocumentCategories();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runDocumentCategoryMigration(): Promise<boolean> {
  try {
    const config = new DocumentCategoryMigrationConfig();

    console.log('🎯 Starting Document Category Migration from MongoDB to PostgreSQL...');
    console.log('📁 Migrating document categories for file management system...');
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

    const migrator = new DocumentCategoryMigrator(config);
    await migrator.run();

    console.log('🎉 Document category migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Document category migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { DocumentCategoryMigrator, DocumentCategoryMigrationConfig, runDocumentCategoryMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runDocumentCategoryMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
