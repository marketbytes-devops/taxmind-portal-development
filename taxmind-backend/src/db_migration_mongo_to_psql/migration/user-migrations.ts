import { and, eq, inArray } from 'drizzle-orm';
import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { policyTypes } from '@/constants';
import { db, models, pool } from '@/database';
import { users } from '@/database/models';
import ApiError from '@/utils/apiError';
import { hashWithHMAC } from '@/utils/crypto';

import defaults from '../default';
import { UserModel } from '../schema/user';

// Type definitions
interface MongoUser extends Document {
  _id: mongoose.Types.ObjectId;
  role: string;
  fullName?: string;
  maidenName?: string;
  email?: string;
  phone?: string;
  dob?: Date;
  profession?: string;
  ppsNumber?: string;
  address?: string;
  eircode?: string;
  signature?: string;
  maritalStatus?: string;
  spouseDetails?: {
    fullName?: string;
    maidenName?: string;
    email?: string;
    phone?: string;
    dob?: Date;
    profession?: string;
    ppsNumber?: string;
    address?: string;
    eircode?: string;
    signature?: string;
  };
  password?: string;
  lastUpdatedOn: Date;
  status: string;
  statusHistory: Array<{
    status: string;
    isAuto: boolean;
    updatedAt: Date;
  }>;
  create_date: Date;
  update_date: Date;
}

interface MigrationError {
  userId: string;
  error: string;
  mongoData: Partial<MongoUser>;
  timestamp: Date;
}

// Configuration
class UserMigrationConfig {
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
class MigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public spousesProcessed: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    userId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoUser> = {}
  ): void {
    this.errors.push({
      userId: userId.toString(),
      error: error instanceof Error ? error.message : String(error),
      mongoData,
      timestamp: new Date(),
    });
    this.failedMigrations++;
  }

  addSuccess(): void {
    this.successfulMigrations++;
  }

  addSpouse(): void {
    this.spousesProcessed++;
  }

  addSkipped(): void {
    this.skippedRecords++;
  }

  getSuccessRate(): string {
    if (this.totalRecords === 0) return '0.00';
    return ((this.successfulMigrations / this.totalRecords) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// User Migration Class
class UserMigrator {
  private config: UserMigrationConfig;
  private stats: MigrationStats;
  private policiesMap: Map<string, string> = new Map();

  constructor(config: UserMigrationConfig) {
    this.config = config;
    this.stats = new MigrationStats();
  }

  async connect(): Promise<void> {
    try {
      // Connect to MongoDB using Mongoose
      console.log(true, this.config.mongoUri);
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
      // Note: Don't close the shared pool as it might be used by other parts of the application
      console.log('📡 Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Convert MongoDB date to PostgreSQL timestamp
  private convertMongoDate(mongoDate: Date | string | null | undefined): Date | null {
    if (!mongoDate) return null;
    if (mongoDate instanceof Date) return mongoDate;
    if (typeof mongoDate === 'string') return new Date(mongoDate);
    return new Date(mongoDate);
  }

  // Map MongoDB status to PostgreSQL boolean
  private mapStatus(mongoStatus: string): boolean {
    const statusMap: { [key: string]: boolean } = {
      ACTIVE: true,
      PENDING: true,
      INACTIVE: false,
      DELETED: false,
    };
    return statusMap[mongoStatus] !== undefined ? statusMap[mongoStatus] : true;
  }
  private mapMaritalStatus(mongoStatus: string): string {
    const statusMap: { [key: string]: string } = {
      Single: 'single',
      Married: 'married',
      Unmarried: 'single',
    };
    return statusMap[mongoStatus] || 'single';
  }

  // Insert user into PostgreSQL using Drizzle ORM
  private async insertUser(mongoUser: any): Promise<boolean> {
    try {
      const user = await db
        .insert(users)
        .values({
          email: mongoUser.email,
          name: mongoUser.fullName,
          status: this.mapStatus(mongoUser.status),
          hashedEmail: hashWithHMAC(mongoUser.email || ''),
          hashedPhone: hashWithHMAC(mongoUser.phone || ''),
          hashedPpsNumber: hashWithHMAC(mongoUser.ppsNumber || ''),
          hashedName: hashWithHMAC(mongoUser.fullName || ''),
          phone: mongoUser.phone,
          dob: mongoUser.dob ? mongoUser.dob.toISOString().split('T')[0] : '',
          profession: mongoUser.profession || '',
          ppsNumber: mongoUser.ppsNumber || '',
          address: mongoUser.address || '',
          eircode: mongoUser.eircode || '',
          maritalStatus: this.mapMaritalStatus(mongoUser.maritalStatus || 'single'),
          password: null,
          passwordSetAt: mongoUser.lastUpdatedOn ? new Date(mongoUser.lastUpdatedOn) : null,
          emailVerifiedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
          isEmailOtpVerified: true,
          isPhoneOtpVerified: true,
          phoneVerifiedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
          isEmailNotificationEnabled: true,
          isAppNotificationEnabled: true,
          isPrimaryAccount: true,
          createdAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
          updatedAt: mongoUser.update_date ? new Date(mongoUser.update_date) : new Date(),
          deletedAt:
            mongoUser.status === 'DELETED'
              ? mongoUser.lastUpdatedOn
                ? new Date(mongoUser.lastUpdatedOn)
                : new Date()
              : null,
          privacyPolicyId: this.policiesMap.get(policyTypes.PRIVACY_POLICY)!,
          privacyPolicyAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
          cookiePolicyId: this.policiesMap.get(policyTypes.COOKIES_POLICY)!,
          cookiePolicyAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
          feeStructureId: this.policiesMap.get(policyTypes.FEE_STRUCTURE)!,
          feeStructureAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
          termsAndConditionId: this.policiesMap.get(policyTypes.TERMS_CONDITIONS)!,
          termsAndConditionAcceptedAt: mongoUser.create_date
            ? new Date(mongoUser.create_date)
            : null,
          isSignatureConsentCompleted: mongoUser.signature ? true : false,
          signatureConsentCompletedAt: mongoUser.signature
            ? mongoUser.lastUpdatedOn
              ? new Date(mongoUser.lastUpdatedOn)
              : new Date()
            : null,
          isTaxAgentVerificationCompleted: true,
          taxAgentVerificationCompletedAt: mongoUser.lastUpdatedOn
            ? new Date(mongoUser.lastUpdatedOn)
            : null,
        } as any)
        .returning();

      console.log('Inserted user with ID:', user[0].id);

      if (
        mongoUser.maritalStatus === 'Married' &&
        mongoUser.spouseDetails &&
        mongoUser.spouseDetails.fullName
      ) {
        const spouseUser = await db
          .insert(users)
          .values({
            email: mongoUser.spouseDetails.email,
            name: mongoUser.spouseDetails.fullName,
            status: this.mapStatus(mongoUser.spouseDetails.status),
            hashedEmail: hashWithHMAC(mongoUser.spouseDetails.email || ''),
            hashedPhone: hashWithHMAC(mongoUser.spouseDetails.phone || ''),
            hashedPpsNumber: hashWithHMAC(mongoUser.spouseDetails.ppsNumber || ''),
            hashedName: hashWithHMAC(mongoUser.spouseDetails.fullName || ''),
            phone: mongoUser.spouseDetails.phone,
            dob: mongoUser.spouseDetails.dob
              ? mongoUser.spouseDetails.dob.toISOString().split('T')[0]
              : '',
            profession: mongoUser.spouseDetails.profession || '',
            ppsNumber: mongoUser.spouseDetails.ppsNumber || '',
            address: mongoUser.spouseDetails.address || '',
            eircode: mongoUser.spouseDetails.eircode || '',
            maritalStatus: 'married',
            password: mongoUser.spouseDetails.password || null,
            passwordSetAt: mongoUser.lastUpdatedOn ? new Date(mongoUser.lastUpdatedOn) : null,
            emailVerifiedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
            isEmailOtpVerified: true,
            isPhoneOtpVerified: true,
            phoneVerifiedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
            isEmailNotificationEnabled: true,
            isAppNotificationEnabled: true,
            isPrimaryAccount: false,
            createdAt: mongoUser.create_date ? new Date(mongoUser.create_date) : new Date(),
            updatedAt: mongoUser.update_date ? new Date(mongoUser.update_date) : new Date(),
            deletedAt:
              mongoUser.status === 'DELETED'
                ? mongoUser.lastUpdatedOn
                  ? new Date(mongoUser.lastUpdatedOn)
                  : new Date()
                : null,
            privacyPolicyId: this.policiesMap.get(policyTypes.PRIVACY_POLICY)!,
            privacyPolicyAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
            cookiePolicyId: this.policiesMap.get(policyTypes.COOKIES_POLICY)!,
            cookiePolicyAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
            feeStructureId: this.policiesMap.get(policyTypes.FEE_STRUCTURE)!,
            feeStructureAcceptedAt: mongoUser.create_date ? new Date(mongoUser.create_date) : null,
            termsAndConditionId: this.policiesMap.get(policyTypes.TERMS_CONDITIONS)!,
            termsAndConditionAcceptedAt: mongoUser.create_date
              ? new Date(mongoUser.create_date)
              : null,
            isSignatureConsentCompleted: mongoUser.spouseDetails.signature ? true : false,
            signatureConsentCompletedAt: mongoUser.spouseDetails.signature
              ? mongoUser.lastUpdatedOn
                ? new Date(mongoUser.lastUpdatedOn)
                : new Date()
              : null,
            parentId: user[0].id,
            isTaxAgentVerificationCompleted: true,
            taxAgentVerificationCompletedAt: mongoUser.lastUpdatedOn
              ? new Date(mongoUser.lastUpdatedOn)
              : null,
          } as any)
          .returning();

        console.log('Inserted spouse user with ID:', spouseUser[0].id);

        // Update mongo spouse user with pg user id
        await UserModel.updateOne(
          {
            _id: mongoUser._id,
            'spouseDetails.email': mongoUser.spouseDetails.email,
          },
          {
            $set: {
              'spouseDetails.pgUserId': spouseUser[0].id,
            },
          }
        ).exec();
        console.log('Updated MongoDB spouse record with PostgreSQL ID:', spouseUser[0].id);

        // Update mongo user with pg user id (must happen regardless of spouse)
        await UserModel.updateOne(
          { _id: mongoUser._id },
          { $set: { pgUserId: user[0].id } }
        ).exec();
        console.log('Updated MongoDB main user record with PostgreSQL ID:', user[0].id);

        // Count the spouse as processed
        return true; // Indicate that a spouse was processed
      }

      // update mongo user with pg user id (for users without spouse)
      await UserModel.updateOne({ _id: mongoUser._id }, { $set: { pgUserId: user[0].id } }).exec();
      console.log('Updated MongoDB user record with PostgreSQL ID:', user[0].id);

      return false; // No spouse was processed
    } catch (error) {
      console.error('Drizzle insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateUsers(): Promise<void> {
    try {
      // Use Mongoose to get user count and data
      this.stats.totalRecords = await UserModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} user records`);
      console.log('📊 Progress will be logged every 100 records...\n');
      await this.loadPolicies();

      // Use Mongoose cursor for better memory efficiency take 10 records at a time
      const cursor = UserModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating users...');

      for (
        let mongoUser = await cursor.next();
        mongoUser != null;
        mongoUser = await cursor.next()
      ) {
        processedCount++;

        console.log(mongoUser);

        try {
          // Skip users without essential data
          if (!mongoUser.email && !mongoUser.fullName) {
            console.warn(
              `⚠️  Skipping user ${mongoUser._id}: Missing essential data (email and fullName)`
            );
            this.stats.addSkipped();
            continue;
          }
          console.log(mongoUser);
          const spouseProcessed = await this.insertUser(mongoUser);
          this.stats.addSuccess();

          // If a spouse was processed, count it
          if (spouseProcessed) {
            this.stats.addSpouse();
          }

          // Log progress every 100 records
          if (processedCount % 100 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} users (${this.stats.successfulMigrations} successful, ${this.stats.spousesProcessed} spouses)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to migrate user ${mongoUser._id}:`, (error as Error).message);
          this.stats.addError(mongoUser._id as mongoose.Types.ObjectId, error as Error, {
            fullName: mongoUser.fullName as string,
            email: mongoUser.email as string,
            status: mongoUser.status,
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 User migration failed:', error);
      throw error;
    }
  }

  async loadPolicies() {
    // Load policies from the postgreSQL database and populate policiesMap
    // Fetch all required active policies in one query, map by type, and validate
    const requiredTypes = [
      policyTypes.PRIVACY_POLICY,
      policyTypes.COOKIES_POLICY,
      policyTypes.FEE_STRUCTURE,
      policyTypes.TERMS_CONDITIONS,
    ] as const;

    const policies = await db.query.policies.findMany({
      where: and(
        inArray(models.policies.type, requiredTypes as unknown as string[]),
        eq(models.policies.isActive, true)
      ),
      columns: { id: true, type: true },
      limit: requiredTypes.length,
    });

    const policyByType = new Map(policies.map((p) => [p.type, p]));
    const missing = requiredTypes.filter((t) => !policyByType.has(t));
    if (missing.length) {
      throw new ApiError(
        `System configuration error: Missing active policies for types: ${missing.join(', ')}`
      );
    }

    const privacy = policyByType.get(policyTypes.PRIVACY_POLICY)!;
    const cookies = policyByType.get(policyTypes.COOKIES_POLICY)!;
    const fee = policyByType.get(policyTypes.FEE_STRUCTURE)!;
    const terms = policyByType.get(policyTypes.TERMS_CONDITIONS)!;

    this.policiesMap.set(policyTypes.PRIVACY_POLICY, privacy.id);
    this.policiesMap.set(policyTypes.COOKIES_POLICY, cookies.id);
    this.policiesMap.set(policyTypes.FEE_STRUCTURE, fee.id);
    this.policiesMap.set(policyTypes.TERMS_CONDITIONS, terms.id);
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 USER MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`👥 Spouses Processed: ${this.stats.spousesProcessed}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);
    console.log(
      `👨‍👩‍👧‍👦 Total Users Created: ${this.stats.successfulMigrations + this.stats.spousesProcessed}`
    );

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. User ${error.userId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Create actual policy records to replace default UUIDs');
    console.log('2. Verify encrypted field data integrity');
    console.log('3. Test user authentication with migrated data');
    console.log('4. Update any sequences if using auto-increment fields');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateUsers();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runUserMigration(): Promise<boolean> {
  try {
    const config = new UserMigrationConfig();

    console.log('🎯 Starting User Migration from MongoDB to PostgreSQL...');
    console.log('🔐 Using Mongoose with automatic encryption/decryption');
    console.log('📋 Configuration Source:');

    // Show configuration source
    if (process.env.MONGO_URI) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI)');
    } else if (process.env.MONGO_URI_DEV) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI_DEV)');
    } else {
      console.log('   MongoDB URI: Default configuration (default.js)');
    }

    if (process.env.MONGO_DB_NAME) {
      console.log('   Database: Environment variable (MONGO_DB_NAME)');
    } else {
      console.log('   Database: Extracted from URI or default');
    }

    console.log(`📡 MongoDB URI: ${config.mongoUri.replace(/\/\/.*@/, '//***@')}`);
    console.log(`🗄️  MongoDB Database: ${config.mongoDbName}`);
    console.log(`🐘 PostgreSQL: Connected\n`);

    const migrator = new UserMigrator(config);
    await migrator.run();

    console.log('🎉 User migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 User migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { UserMigrator, UserMigrationConfig, runUserMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runUserMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
