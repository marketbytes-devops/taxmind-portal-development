import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, pool } from '@/database';
import { queries, queryCategories } from '@/database/models';

import defaults from '../default';
import { QueryCategoryModel, QueryModel } from '../schema/queries';

// Type definitions for MongoDB QueryCategory document
interface MongoQueryCategory extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  create_date: Date;
  update_date: Date;
  pgQueryCategoryId?: string; // Will be added after migration
}

// Type definitions for MongoDB Query document
interface MongoQuery extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  categoryId?: mongoose.Types.ObjectId;
  message: string;
  status: string; // ACTIVE, INACTIVE, DELETED
  create_date: Date;
  update_date: Date;
  pgQueryId?: string; // Will be added after migration
}

interface MigrationError {
  itemId: string;
  itemType: 'category' | 'query';
  error: string;
  mongoData: Partial<MongoQueryCategory | MongoQuery>;
  timestamp: Date;
}

// Configuration
class QueryMigrationConfig {
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
class QueryMigrationStats {
  // Category stats
  public totalCategories: number = 0;
  public successfulCategoryMigrations: number = 0;
  public failedCategoryMigrations: number = 0;
  public skippedCategories: number = 0;
  public activeCategoryRecords: number = 0;
  public inactiveCategoryRecords: number = 0;
  public deletedCategoryRecords: number = 0;

  // Query stats
  public totalQueries: number = 0;
  public successfulQueryMigrations: number = 0;
  public failedQueryMigrations: number = 0;
  public skippedQueries: number = 0;
  public activeQueryRecords: number = 0;
  public inactiveQueryRecords: number = 0;
  public deletedQueryRecords: number = 0;
  public queriesWithCategory: number = 0;
  public queriesWithoutCategory: number = 0;

  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    itemId: mongoose.Types.ObjectId | string,
    itemType: 'category' | 'query',
    error: Error | string,
    mongoData: Partial<MongoQueryCategory | MongoQuery> = {}
  ): void {
    this.errors.push({
      itemId: itemId.toString(),
      itemType,
      error: error instanceof Error ? error.message : String(error),
      mongoData,
      timestamp: new Date(),
    });

    if (itemType === 'category') {
      this.failedCategoryMigrations++;
    } else {
      this.failedQueryMigrations++;
    }
  }

  addCategorySuccess(): void {
    this.successfulCategoryMigrations++;
  }

  addQuerySuccess(): void {
    this.successfulQueryMigrations++;
  }

  addCategorySkipped(): void {
    this.skippedCategories++;
  }

  addQuerySkipped(): void {
    this.skippedQueries++;
  }

  addActiveCategoryRecord(): void {
    this.activeCategoryRecords++;
  }

  addInactiveCategoryRecord(): void {
    this.inactiveCategoryRecords++;
  }

  addDeletedCategoryRecord(): void {
    this.deletedCategoryRecords++;
  }

  addActiveQueryRecord(): void {
    this.activeQueryRecords++;
  }

  addInactiveQueryRecord(): void {
    this.inactiveQueryRecords++;
  }

  addDeletedQueryRecord(): void {
    this.deletedQueryRecords++;
  }

  addQueryWithCategory(): void {
    this.queriesWithCategory++;
  }

  addQueryWithoutCategory(): void {
    this.queriesWithoutCategory++;
  }

  getCategorySuccessRate(): string {
    if (this.totalCategories === 0) return '0.00';
    return ((this.successfulCategoryMigrations / this.totalCategories) * 100).toFixed(2);
  }

  getQuerySuccessRate(): string {
    if (this.totalQueries === 0) return '0.00';
    return ((this.successfulQueryMigrations / this.totalQueries) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Query Migration Class
class QueryMigrator {
  private config: QueryMigrationConfig;
  private stats: QueryMigrationStats;
  private categoryIdMap: Map<string, string> = new Map(); // MongoDB ObjectId -> PostgreSQL UUID

  constructor(config: QueryMigrationConfig) {
    this.config = config;
    this.stats = new QueryMigrationStats();
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

  // Insert query category into PostgreSQL using Drizzle ORM
  private async insertQueryCategory(mongoCategory: MongoQueryCategory): Promise<void> {
    try {
      // Map status from MongoDB to PostgreSQL
      const isActive = mongoCategory.status === 'ACTIVE';
      const isDeleted = mongoCategory.status === 'DELETED';

      // Update stats based on status
      if (isDeleted) {
        this.stats.addDeletedCategoryRecord();
      } else if (isActive) {
        this.stats.addActiveCategoryRecord();
      } else {
        this.stats.addInactiveCategoryRecord();
      }

      // Insert query category record
      const [categoryRecord] = await db
        .insert(queryCategories)
        .values({
          name: mongoCategory.name,
          description: null, // Not available in MongoDB schema
          deletedAt: isDeleted ? mongoCategory.update_date : null,
          createdAt: mongoCategory.create_date || new Date(),
          updatedAt: mongoCategory.update_date || new Date(),
        })
        .returning({ id: queryCategories.id });

      console.log(
        `✅ Inserted query category "${mongoCategory.name}" with ID: ${categoryRecord.id}`
      );

      // Store mapping for queries
      this.categoryIdMap.set(mongoCategory._id.toString(), categoryRecord.id);

      // Update MongoDB record with PostgreSQL ID
      await QueryCategoryModel.updateOne(
        { _id: mongoCategory._id },
        { $set: { pgQueryCategoryId: categoryRecord.id } }
      );
    } catch (error) {
      console.error('Drizzle query category insert error:', error);
      throw error;
    }
  }

  // Insert query into PostgreSQL using Drizzle ORM
  private async insertQuery(mongoQuery: MongoQuery): Promise<void> {
    try {
      // Map status from MongoDB to PostgreSQL (queries table doesn't have status/deleted fields in the schema)
      const isDeleted = mongoQuery.status === 'DELETED';

      // Skip deleted queries since PostgreSQL table doesn't support soft deletes
      if (isDeleted) {
        this.stats.addDeletedQueryRecord();
        this.stats.addQuerySkipped();
        console.warn(
          `⚠️  Skipping deleted query ${mongoQuery._id}: PostgreSQL queries table doesn't support soft deletes`
        );
        return;
      }

      // Update stats based on status
      if (mongoQuery.status === 'ACTIVE') {
        this.stats.addActiveQueryRecord();
      } else {
        this.stats.addInactiveQueryRecord();
      }

      // Get PostgreSQL category ID if categoryId exists
      let pgCategoryId: string | null = null;
      if (mongoQuery.categoryId) {
        pgCategoryId = this.categoryIdMap.get(mongoQuery.categoryId.toString()) || null;
        if (pgCategoryId) {
          this.stats.addQueryWithCategory();
        } else {
          console.warn(
            `⚠️  Category mapping not found for query ${mongoQuery._id}, category ${mongoQuery.categoryId}`
          );
          this.stats.addQueryWithoutCategory();
        }
      } else {
        this.stats.addQueryWithoutCategory();
      }

      // Insert query record
      const [queryRecord] = await db
        .insert(queries)
        .values({
          name: mongoQuery.name,
          email: mongoQuery.email,
          message: mongoQuery.message,
          categoryId: pgCategoryId,
          createdAt: mongoQuery.create_date || new Date(),
        })
        .returning({ id: queries.id });

      console.log(
        `✅ Inserted query from "${mongoQuery.name}" (${mongoQuery.email}) with ID: ${queryRecord.id}`
      );

      // Update MongoDB record with PostgreSQL ID
      await QueryModel.updateOne({ _id: mongoQuery._id }, { $set: { pgQueryId: queryRecord.id } });
    } catch (error) {
      console.error('Drizzle query insert error:', error);
      throw error;
    }
  }

  // Migrate query categories first
  async migrateQueryCategories(): Promise<void> {
    try {
      // Get total category count
      this.stats.totalCategories = await QueryCategoryModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalCategories} query category records`);

      if (this.stats.totalCategories === 0) {
        console.log('📝 No query categories found to migrate');
        return;
      }

      // Use Mongoose cursor for better memory efficiency
      const cursor = QueryCategoryModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating query categories...');

      for (
        let mongoCategory = await cursor.next();
        mongoCategory != null;
        mongoCategory = await cursor.next()
      ) {
        processedCount++;

        try {
          // Skip categories without essential data
          if (!mongoCategory.name || mongoCategory.name.trim().length < 2) {
            console.warn(
              `⚠️  Skipping query category ${mongoCategory._id}: Missing or invalid name`
            );
            this.stats.addCategorySkipped();
            continue;
          }

          await this.insertQueryCategory(mongoCategory as any);
          this.stats.addCategorySuccess();

          // Log progress for categories
          if (processedCount % 10 === 0 || processedCount === this.stats.totalCategories) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalCategories} categories (${this.stats.successfulCategoryMigrations} successful)`
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to migrate query category ${mongoCategory._id}:`,
            (error as Error).message
          );
          this.stats.addError(
            mongoCategory._id as mongoose.Types.ObjectId,
            'category',
            error as Error,
            {
              name: mongoCategory.name as string,
              status: mongoCategory.status as string,
            }
          );
        }
      }

      console.log(
        `✅ Query categories migration completed: ${this.stats.successfulCategoryMigrations}/${this.stats.totalCategories} successful\n`
      );
    } catch (error) {
      console.error('💥 Query categories migration failed:', error);
      throw error;
    }
  }

  // Migrate queries after categories
  async migrateQueries(): Promise<void> {
    try {
      // Get total query count
      this.stats.totalQueries = await QueryModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalQueries} query records`);
      console.log('📊 Progress will be logged every 50 records...\n');

      if (this.stats.totalQueries === 0) {
        console.log('📝 No queries found to migrate');
        return;
      }

      // Use Mongoose cursor for better memory efficiency
      const cursor = QueryModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating queries...');

      for (
        let mongoQuery = await cursor.next();
        mongoQuery != null;
        mongoQuery = await cursor.next()
      ) {
        processedCount++;

        try {
          // Skip queries without essential data
          //   if (!mongoQuery.name || !mongoQuery.email || !mongoQuery.message) {
          //     console.warn(
          //       `⚠️  Skipping query ${mongoQuery._id}: Missing essential data (name, email, or message)`
          //     );
          //     this.stats.addQuerySkipped();
          //     continue;
          //   }

          // Validate email format (basic validation)
          //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          //   if (!emailRegex.test(mongoQuery.email)) {
          //     console.warn(`⚠️  Skipping query ${mongoQuery._id}: Invalid email format`);
          //     this.stats.addQuerySkipped();
          //     continue;
          //   }

          await this.insertQuery(mongoQuery as any);
          this.stats.addQuerySuccess();

          // Log progress every 50 records
          if (processedCount % 50 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalQueries} queries (${this.stats.successfulQueryMigrations} successful, ${this.stats.queriesWithCategory} with category)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to migrate query ${mongoQuery._id}:`, (error as Error).message);
          this.stats.addError(mongoQuery._id as mongoose.Types.ObjectId, 'query', error as Error, {
            name: mongoQuery.name as string,
            email: mongoQuery.email as string,
            message: mongoQuery.message?.substring(0, 100) + '...',
            status: mongoQuery.status,
          });
        }
      }

      console.log(
        `✅ Queries migration completed: ${this.stats.successfulQueryMigrations}/${this.stats.totalQueries} successful\n`
      );
    } catch (error) {
      console.error('💥 Queries migration failed:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateAll(): Promise<void> {
    try {
      // Step 1: Migrate categories first (required for foreign key relationships)
      await this.migrateQueryCategories();

      // Step 2: Migrate queries
      await this.migrateQueries();

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Query migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 QUERY MIGRATION SUMMARY');
    console.log('='.repeat(70));

    // Category summary
    console.log('📋 QUERY CATEGORIES:');
    console.log(`   Total Records: ${this.stats.totalCategories}`);
    console.log(`   ✅ Successful: ${this.stats.successfulCategoryMigrations}`);
    console.log(`   🟢 Active: ${this.stats.activeCategoryRecords}`);
    console.log(`   🟡 Inactive: ${this.stats.inactiveCategoryRecords}`);
    console.log(`   🔴 Deleted: ${this.stats.deletedCategoryRecords}`);
    console.log(`   ❌ Failed: ${this.stats.failedCategoryMigrations}`);
    console.log(`   ⚠️  Skipped: ${this.stats.skippedCategories}`);
    console.log(`   📈 Success Rate: ${this.stats.getCategorySuccessRate()}%`);

    console.log('\n📝 QUERIES:');
    console.log(`   Total Records: ${this.stats.totalQueries}`);
    console.log(`   ✅ Successful: ${this.stats.successfulQueryMigrations}`);
    console.log(`   🟢 Active: ${this.stats.activeQueryRecords}`);
    console.log(`   🟡 Inactive: ${this.stats.inactiveQueryRecords}`);
    console.log(`   🔴 Deleted (Skipped): ${this.stats.deletedQueryRecords}`);
    console.log(`   🏷️  With Category: ${this.stats.queriesWithCategory}`);
    console.log(`   🏷️  Without Category: ${this.stats.queriesWithoutCategory}`);
    console.log(`   ❌ Failed: ${this.stats.failedQueryMigrations}`);
    console.log(`   ⚠️  Skipped: ${this.stats.skippedQueries}`);
    console.log(`   📈 Success Rate: ${this.stats.getQuerySuccessRate()}%`);

    console.log(`\n⏱️  Total Duration: ${this.stats.getDuration()} seconds`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(
          `  ${index + 1}. ${error.itemType.toUpperCase()} ${error.itemId}: ${error.error}`
        );
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify query categorization and category assignments');
    console.log('2. Test query filtering and search functionality');
    console.log('3. Review email validation and format consistency');
    console.log('4. Check query-category relationships integrity');
    console.log('5. Consider adding query status/priority fields if needed');
    console.log('6. Validate deleted queries were properly handled');
    console.log('='.repeat(70));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateAll();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runQueryMigration(): Promise<boolean> {
  try {
    const config = new QueryMigrationConfig();

    console.log('🎯 Starting Query Migration from MongoDB to PostgreSQL...');
    console.log('❓ Migrating query categories and customer queries...');
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

    const migrator = new QueryMigrator(config);
    await migrator.run();

    console.log('🎉 Query migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Query migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { QueryMigrator, QueryMigrationConfig, runQueryMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runQueryMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
