import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, pool } from '@/database';
import { files, tax_credits } from '@/database/models';

import defaults from '../default';
import { TaxCreditModel } from '../schema/tax-credits';

// Type definitions for MongoDB TaxCredit document
interface MongoTaxCredit extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  icon?: string; // File path or URL
  description: string;
  details: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  create_date: Date;
  update_date: Date;
  pgTaxCreditId?: string; // Will be added after migration
}

interface MigrationError {
  taxCreditId: string;
  error: string;
  mongoData: Partial<MongoTaxCredit>;
  timestamp: Date;
}

// Configuration
class TaxCreditMigrationConfig {
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
class TaxCreditMigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public iconsProcessed: number = 0;
  public activeRecords: number = 0;
  public inactiveRecords: number = 0;
  public deletedRecords: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    taxCreditId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoTaxCredit> = {}
  ): void {
    this.errors.push({
      taxCreditId: taxCreditId.toString(),
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

  addIcon(): void {
    this.iconsProcessed++;
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

// TaxCredit Migration Class
class TaxCreditMigrator {
  private config: TaxCreditMigrationConfig;
  private stats: TaxCreditMigrationStats;

  constructor(config: TaxCreditMigrationConfig) {
    this.config = config;
    this.stats = new TaxCreditMigrationStats();
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

  // Insert icon file into PostgreSQL files table
  private async insertIconFile(iconPath: string, taxCreditName: string): Promise<string | null> {
    try {
      if (!iconPath) return null;

      // Extract filename from path
      const fileName =
        iconPath.split('/').pop() || `${taxCreditName.toLowerCase().replace(/\s+/g, '-')}-icon`;

      const [fileRecord] = await db
        .insert(files)
        .values({
          key: iconPath,
          fileName: fileName,
          mimeType: this.getMimeTypeFromFileName(fileName),
          fileSize: '0', // Size not available from MongoDB schema
          fileType: 'image', // Icons are images
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: files.id });

      this.stats.addIcon();
      return fileRecord.id;
    } catch (error) {
      console.error('Failed to insert icon file:', error);
      return null;
    }
  }

  // Helper method to determine MIME type from file name
  private getMimeTypeFromFileName(fileName: string): string {
    if (!fileName) return 'image/png'; // Default for icons

    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      ico: 'image/x-icon',
    };

    return mimeTypes[ext || ''] || 'image/png';
  }

  // Insert tax credit into PostgreSQL using Drizzle ORM
  private async insertTaxCredit(mongoTaxCredit: MongoTaxCredit): Promise<void> {
    try {
      // Handle icon file
      let iconId: string | null = null;
      if (mongoTaxCredit.icon) {
        iconId = await this.insertIconFile(mongoTaxCredit.icon, mongoTaxCredit.name);
      }

      // Map status from MongoDB to PostgreSQL
      const isActive = mongoTaxCredit.status === 'ACTIVE';
      const isDeleted = mongoTaxCredit.status === 'DELETED';

      // Update stats based on status
      if (isDeleted) {
        this.stats.addDeleted();
      } else if (isActive) {
        this.stats.addActive();
      } else {
        this.stats.addInactive();
      }

      // Insert tax credit record
      const [taxCreditRecord] = await db
        .insert(tax_credits)
        .values({
          name: mongoTaxCredit.name,
          slug: mongoTaxCredit.slug,
          iconId,
          description: mongoTaxCredit.description,
          details: mongoTaxCredit.details,
          status: isActive,
          deletedAt: isDeleted ? mongoTaxCredit.update_date : null,
          createdAt: mongoTaxCredit.create_date || new Date(),
          updatedAt: mongoTaxCredit.update_date || new Date(),
        })
        .returning({ id: tax_credits.id });

      console.log(`✅ Inserted tax credit "${mongoTaxCredit.name}" with ID: ${taxCreditRecord.id}`);

      // Update MongoDB record with PostgreSQL ID
      await TaxCreditModel.updateOne(
        { _id: mongoTaxCredit._id },
        { $set: { pgTaxCreditId: taxCreditRecord.id } }
      );
    } catch (error) {
      console.error('Drizzle tax credit insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateTaxCredits(): Promise<void> {
    try {
      // Get total tax credit count
      this.stats.totalRecords = await TaxCreditModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} tax credit records`);
      console.log('📊 Progress will be logged every 10 records...\n');

      // Use Mongoose cursor for better memory efficiency
      const cursor = TaxCreditModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating tax credits...');

      for (
        let mongoTaxCredit = await cursor.next();
        mongoTaxCredit != null;
        mongoTaxCredit = await cursor.next()
      ) {
        processedCount++;

        try {
          // Skip tax credits without essential data
          //   if (!mongoTaxCredit.name || !mongoTaxCredit.slug) {
          //     console.warn(`⚠️  Skipping tax credit ${mongoTaxCredit._id}: Missing name or slug`);
          //     this.stats.addSkipped();
          //     continue;
          //   }

          // Skip if description or details are missing
          //   if (!mongoTaxCredit.description || !mongoTaxCredit.details) {
          //     console.warn(
          //       `⚠️  Skipping tax credit ${mongoTaxCredit._id}: Missing description or details`
          //     );
          //     this.stats.addSkipped();
          //     continue;
          //   }

          await this.insertTaxCredit(mongoTaxCredit as any);
          this.stats.addSuccess();

          // Log progress every 10 records
          if (processedCount % 10 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} tax credits (${this.stats.successfulMigrations} successful, ${this.stats.activeRecords} active, ${this.stats.inactiveRecords} inactive)`
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to migrate tax credit ${mongoTaxCredit._id}:`,
            (error as Error).message
          );
          this.stats.addError(mongoTaxCredit._id as mongoose.Types.ObjectId, error as Error, {
            name: mongoTaxCredit.name as string,
            slug: mongoTaxCredit.slug as string,
            status: mongoTaxCredit.status,
            description: mongoTaxCredit.description?.substring(0, 100) + '...',
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Tax credit migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TAX CREDIT MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`🟢 Active Records: ${this.stats.activeRecords}`);
    console.log(`🟡 Inactive Records: ${this.stats.inactiveRecords}`);
    console.log(`🔴 Deleted Records: ${this.stats.deletedRecords}`);
    console.log(`🖼️  Icons Processed: ${this.stats.iconsProcessed}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. Tax Credit ${error.taxCreditId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify tax credit data integrity and descriptions');
    console.log('2. Test tax credit functionality with migrated data');
    console.log('3. Validate icon files are accessible and display correctly');
    console.log('4. Check slug uniqueness and URL generation');
    console.log('5. Verify status mappings (ACTIVE/INACTIVE/DELETED)');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateTaxCredits();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runTaxCreditMigration(): Promise<boolean> {
  try {
    const config = new TaxCreditMigrationConfig();

    console.log('🎯 Starting Tax Credit Migration from MongoDB to PostgreSQL...');
    console.log('💰 Migrating tax credits with icon file references...');
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

    const migrator = new TaxCreditMigrator(config);
    await migrator.run();

    console.log('🎉 Tax credit migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Tax credit migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { TaxCreditMigrator, TaxCreditMigrationConfig, runTaxCreditMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runTaxCreditMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
