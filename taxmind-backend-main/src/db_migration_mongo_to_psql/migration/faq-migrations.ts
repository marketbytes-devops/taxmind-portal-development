import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, pool } from '@/database';
import { faqs } from '@/database/models';

import defaults from '../default';
import { FaqModel } from '../schema/faq';

// Type definitions for MongoDB FAQ document
interface MongoFaq extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  create_date: Date;
  update_date: Date;
  pgFaqId?: string; // Will be added after migration
}

interface MigrationError {
  faqId: string;
  error: string;
  mongoData: Partial<MongoFaq>;
  timestamp: Date;
}

// Configuration
class FaqMigrationConfig {
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
class FaqMigrationStats {
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
    faqId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoFaq> = {}
  ): void {
    this.errors.push({
      faqId: faqId.toString(),
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

// FAQ Migration Class
class FaqMigrator {
  private config: FaqMigrationConfig;
  private stats: FaqMigrationStats;

  constructor(config: FaqMigrationConfig) {
    this.config = config;
    this.stats = new FaqMigrationStats();
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

  // Insert FAQ into PostgreSQL using Drizzle ORM
  private async insertFaq(mongoFaq: MongoFaq): Promise<void> {
    try {
      // Map status from MongoDB to PostgreSQL
      const isActive = mongoFaq.status === 'ACTIVE';
      const isDeleted = mongoFaq.status === 'DELETED';

      // Update stats based on status
      if (isDeleted) {
        this.stats.addDeleted();
      } else if (isActive) {
        this.stats.addActive();
      } else {
        this.stats.addInactive();
      }

      // Insert FAQ record
      const [faqRecord] = await db
        .insert(faqs)
        .values({
          question: mongoFaq.question,
          answer: mongoFaq.answer,
          status: isActive,
          deletedAt: isDeleted ? mongoFaq.update_date : null,
          createdAt: mongoFaq.create_date || new Date(),
          updatedAt: mongoFaq.update_date || new Date(),
        })
        .returning({ id: faqs.id });

      console.log(
        `✅ Inserted FAQ "${mongoFaq.question.substring(0, 50)}..." with ID: ${faqRecord.id}`
      );

      // Update MongoDB record with PostgreSQL ID
      await FaqModel.updateOne({ _id: mongoFaq._id }, { $set: { pgFaqId: faqRecord.id } });
    } catch (error) {
      console.error('Drizzle FAQ insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateFaqs(): Promise<void> {
    try {
      // Get total FAQ count
      this.stats.totalRecords = await FaqModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} FAQ records`);
      console.log('📊 Progress will be logged every 25 records...\n');

      // Use Mongoose cursor for better memory efficiency
      const cursor = FaqModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating FAQs...');

      for (let mongoFaq = await cursor.next(); mongoFaq != null; mongoFaq = await cursor.next()) {
        processedCount++;

        try {
          //   // Skip FAQs without essential data
          //   if (!mongoFaq.question || !mongoFaq.answer) {
          //     console.warn(`⚠️  Skipping FAQ ${mongoFaq._id}: Missing question or answer`);
          //     this.stats.addSkipped();
          //     continue;
          //   }

          //   // Skip FAQs with empty or very short content
          //   if (mongoFaq.question.trim().length < 3 || mongoFaq.answer.trim().length < 3) {
          //     console.warn(`⚠️  Skipping FAQ ${mongoFaq._id}: Question or answer too short`);
          //     this.stats.addSkipped();
          //     continue;
          //   }

          await this.insertFaq(mongoFaq as any);
          this.stats.addSuccess();

          // Log progress every 25 records
          if (processedCount % 25 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} FAQs (${this.stats.successfulMigrations} successful, ${this.stats.activeRecords} active, ${this.stats.inactiveRecords} inactive)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to migrate FAQ ${mongoFaq._id}:`, (error as Error).message);
          this.stats.addError(mongoFaq._id as mongoose.Types.ObjectId, error as Error, {
            question: mongoFaq.question?.substring(0, 100) + '...',
            answer: mongoFaq.answer?.substring(0, 100) + '...',
            status: mongoFaq.status,
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 FAQ migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FAQ MIGRATION SUMMARY');
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
        console.log(`  ${index + 1}. FAQ ${error.faqId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify FAQ content formatting and readability');
    console.log('2. Test FAQ search and filtering functionality');
    console.log('3. Review question and answer content quality');
    console.log('4. Check FAQ ordering and categorization needs');
    console.log('5. Validate status mappings (ACTIVE/INACTIVE/DELETED)');
    console.log('6. Consider adding FAQ categories or tags if needed');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateFaqs();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runFaqMigration(): Promise<boolean> {
  try {
    const config = new FaqMigrationConfig();

    console.log('🎯 Starting FAQ Migration from MongoDB to PostgreSQL...');
    console.log('❓ Migrating frequently asked questions and answers...');
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

    const migrator = new FaqMigrator(config);
    await migrator.run();

    console.log('🎉 FAQ migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 FAQ migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { FaqMigrator, FaqMigrationConfig, runFaqMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runFaqMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
