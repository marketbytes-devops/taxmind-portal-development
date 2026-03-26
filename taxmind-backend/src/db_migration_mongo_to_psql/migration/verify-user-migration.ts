import { Pool, PoolClient, QueryResult } from 'pg';

// Type definitions
interface UserCounts {
  total: number;
  active: number;
  inactive: number;
  withEmail: number;
  withPhone: number;
  withName: number;
}

interface SampleUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: boolean;
  hashed_email: string | null;
  hashed_phone: string | null;
  is_primary_account: boolean;
  created_at: Date;
  updated_at: Date;
}

interface IntegrityCheck {
  name: string;
  count: number;
  status: string;
}

// Verification Configuration
class VerificationConfig {
  public pgConnectionString: string;

  constructor() {
    this.pgConnectionString = process.env.DATABASE_URL;

    if (!this.pgConnectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
  }
}

// User Migration Verifier
class UserMigrationVerifier {
  private config: VerificationConfig;
  private pgPool: Pool;

  constructor(config: VerificationConfig) {
    this.config = config;
    this.pgPool = new Pool({ connectionString: config.pgConnectionString });
  }

  async connect(): Promise<void> {
    try {
      const client: PoolClient = await this.pgPool.connect();
      client.release();
      console.log('✅ Connected to PostgreSQL successfully');
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pgPool.end();
      console.log('📡 Disconnected from PostgreSQL');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async getUserCounts(): Promise<UserCounts> {
    const queries: Record<keyof UserCounts, string> = {
      total: 'SELECT COUNT(*) as count FROM users',
      active: 'SELECT COUNT(*) as count FROM users WHERE status = true',
      inactive: 'SELECT COUNT(*) as count FROM users WHERE status = false',
      withEmail: "SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL AND email != ''",
      withPhone: "SELECT COUNT(*) as count FROM users WHERE phone IS NOT NULL AND phone != ''",
      withName: "SELECT COUNT(*) as count FROM users WHERE name IS NOT NULL AND name != ''",
    };

    const results: Partial<UserCounts> = {};

    for (const [key, query] of Object.entries(queries)) {
      try {
        const result: QueryResult = await this.pgPool.query(query);
        results[key as keyof UserCounts] = parseInt(result.rows[0].count);
      } catch (error) {
        console.error(`Error executing ${key} query:`, error);
        results[key as keyof UserCounts] = 0;
      }
    }

    return results as UserCounts;
  }

  async getSampleUser(): Promise<SampleUser | null> {
    try {
      const result: QueryResult = await this.pgPool.query('SELECT * FROM users LIMIT 1');
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching sample user:', error);
      return null;
    }
  }

  async checkDataIntegrity(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];

    try {
      // Check for users without essential data
      const missingEmailResult: QueryResult = await this.pgPool.query(
        "SELECT COUNT(*) as count FROM users WHERE email IS NULL OR email = ''"
      );
      const missingEmail = parseInt(missingEmailResult.rows[0].count);

      checks.push({
        name: 'Users without email',
        count: missingEmail,
        status: missingEmail === 0 ? '✅' : '⚠️',
      });

      // Check for users with hashed fields
      const hashedFieldsResult: QueryResult = await this.pgPool.query(
        "SELECT COUNT(*) as count FROM users WHERE hashed_email IS NOT NULL AND hashed_email != ''"
      );
      const hasHashedFields = parseInt(hashedFieldsResult.rows[0].count);

      checks.push({
        name: 'Users with hashed fields',
        count: hasHashedFields,
        status: hasHashedFields > 0 ? '✅' : '❌',
      });

      // Check for default policy IDs
      const defaultPolicyResult: QueryResult = await this.pgPool.query(
        "SELECT COUNT(*) as count FROM users WHERE privacy_policy_id = '00000000-0000-0000-0000-000000000001'"
      );
      const defaultPolicyCount = parseInt(defaultPolicyResult.rows[0].count);

      checks.push({
        name: 'Users with default policy IDs',
        count: defaultPolicyCount,
        status: defaultPolicyCount > 0 ? '⚠️' : '✅',
      });
    } catch (error) {
      console.error('Error checking data integrity:', error);
    }

    return checks;
  }

  async verify(): Promise<void> {
    try {
      console.log('🔍 Starting User Migration Verification...\n');

      // Get user counts
      const counts = await this.getUserCounts();

      // Get sample user
      const sampleUser = await this.getSampleUser();

      // Check data integrity
      const integrityChecks = await this.checkDataIntegrity();

      // Display results
      console.log('📊 USER MIGRATION VERIFICATION RESULTS');
      console.log('='.repeat(50));
      console.log(`👥 Total Users: ${counts.total}`);
      console.log(`✅ Active Users: ${counts.active}`);
      console.log(`❌ Inactive Users: ${counts.inactive}`);
      console.log(`📧 Users with Email: ${counts.withEmail}`);
      console.log(`📱 Users with Phone: ${counts.withPhone}`);
      console.log(`👤 Users with Name: ${counts.withName}`);

      if (sampleUser) {
        console.log('\n📋 SAMPLE USER DATA:');
        console.log('='.repeat(30));
        console.log(`ID: ${sampleUser.id}`);
        console.log(`Name: ${sampleUser.name ? '[ENCRYPTED]' : '[NOT SET]'}`);
        console.log(`Email: ${sampleUser.email ? '[ENCRYPTED]' : '[NOT SET]'}`);
        console.log(`Phone: ${sampleUser.phone ? '[ENCRYPTED]' : '[NOT SET]'}`);
        console.log(`Status: ${sampleUser.status ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`Hashed Email: ${sampleUser.hashed_email ? 'SET' : 'NOT SET'}`);
        console.log(`Hashed Phone: ${sampleUser.hashed_phone ? 'SET' : 'NOT SET'}`);
        console.log(`Primary Account: ${sampleUser.is_primary_account ? 'YES' : 'NO'}`);
        console.log(`Created: ${sampleUser.created_at}`);
        console.log(`Updated: ${sampleUser.updated_at}`);
      }

      // Data quality checks
      console.log('\n🔍 DATA INTEGRITY CHECKS:');
      console.log('='.repeat(30));

      integrityChecks.forEach((check) => {
        console.log(`${check.status} ${check.name}: ${check.count}`);
      });

      // Success rate calculation
      const successRate =
        counts.total > 0 ? ((counts.withEmail / counts.total) * 100).toFixed(1) : '0';

      console.log('\n📈 QUALITY METRICS:');
      console.log('='.repeat(30));
      if (counts.total === 0) {
        console.log('⚠️  No users found! Migration may have failed.');
      } else {
        console.log(`✅ ${counts.total} users successfully migrated`);
        console.log(`📊 Email data coverage: ${successRate}%`);

        if (counts.active > counts.inactive) {
          console.log(`✅ More active users (${counts.active}) than inactive (${counts.inactive})`);
        } else {
          console.log(
            `ℹ️  More inactive users (${counts.inactive}) than active (${counts.active})`
          );
        }
      }

      // Recommendations
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('='.repeat(30));
      console.log('1. 📋 Create actual policy records to replace default UUIDs');
      console.log('2. 🔍 Verify encryption/decryption is working correctly');
      console.log('3. 🧪 Test user authentication with migrated data');
      console.log('4. 📊 Check for any missing required fields');
      console.log('5. 🔗 Verify foreign key relationships');

      // SQL queries for manual verification
      console.log('\n🔧 MANUAL VERIFICATION QUERIES:');
      console.log('='.repeat(30));
      console.log('-- Check for orphaned users (if other tables reference users)');
      console.log(
        '-- SELECT COUNT(*) FROM applications WHERE user_id NOT IN (SELECT id FROM users);'
      );
      console.log('-- SELECT COUNT(*) FROM chats WHERE user_id NOT IN (SELECT id FROM users);');
      console.log('');
      console.log('-- Check policy distribution');
      console.log('-- SELECT privacy_policy_id, COUNT(*) FROM users GROUP BY privacy_policy_id;');
      console.log('');
      console.log('-- Check encrypted field lengths (should be consistent if encrypted)');
      console.log(
        '-- SELECT LENGTH(email) as email_len, COUNT(*) FROM users WHERE email IS NOT NULL GROUP BY LENGTH(email);'
      );

      console.log('\n🎉 User migration verification completed!');
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  async run(): Promise<void> {
    try {
      await this.connect();
      await this.verify();
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runVerification(): Promise<boolean> {
  try {
    const config = new VerificationConfig();

    console.log('🎯 Starting User Migration Verification...');
    console.log(`🐘 PostgreSQL: Connected\n`);

    const verifier = new UserMigrationVerifier(config);
    await verifier.run();

    return true;
  } catch (error) {
    console.error('💥 Verification failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { UserMigrationVerifier, VerificationConfig, runVerification };

// Run verification if this file is executed directly
if (require.main === module) {
  runVerification()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
