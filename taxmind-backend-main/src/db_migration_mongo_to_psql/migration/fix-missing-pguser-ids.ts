import { and, isNull, sql } from 'drizzle-orm';
import mongoose from 'mongoose';

import { db } from '@/database';
import { users } from '@/database/models';
import { hashTrigrams } from '@/utils/crypto';

import defaults from '../default';
import { UserModel } from '../schema/user';

interface FixStats {
  totalMissingPgUserId: number;
  successfulFixes: number;
  failedFixes: number;
  errors: Array<{
    mongoId: string;
    error: string;
    timestamp: Date;
  }>;
  startTime: Date;
}

async function fixMissingPgUserIds() {
  const stats: FixStats = {
    totalMissingPgUserId: 0,
    successfulFixes: 0,
    failedFixes: 0,
    errors: [],
    startTime: new Date(),
  };

  try {
    // Connect to MongoDB using same logic as migration
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DEV || defaults.MONGO_URI_DEV;
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📡 Using MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***@')}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully');

    // Count users without pgUserId
    stats.totalMissingPgUserId = await UserModel.countDocuments({ pgUserId: { $exists: false } });
    console.log(`📊 Found ${stats.totalMissingPgUserId} users without pgUserId`);

    if (stats.totalMissingPgUserId === 0) {
      console.log('✅ No users need fixing!');
      return;
    }

    // Get users without pgUserId
    const missingUsers = await UserModel.find(
      { pgUserId: { $exists: false } },
      {
        _id: 1,
        email: 1,
        fullName: 1,
        phone: 1,
        ppsNumber: 1,
        maritalStatus: 1,
        spouseDetails: 1,
      }
    );

    console.log('🔄 Starting to fix missing pgUserId entries...\n');

    for (const mongoUser of missingUsers) {
      try {
        console.log(`Processing user: ${mongoUser._id} (${mongoUser.email || mongoUser.fullName})`);

        // Find matching PostgreSQL user using multiple criteria with trigram exact matching
        let pgUser = null;

        // First, try to find by email trigram hashes if email exists
        if (mongoUser.email) {
          const emailTrigramHashes = hashTrigrams(mongoUser.email.toLowerCase());
          pgUser = await db.query.users.findFirst({
            where: and(
              sql`email_trigram_hashes @> ARRAY[${sql.join(
                emailTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              sql`email_trigram_hashes <@ ARRAY[${sql.join(
                emailTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(users.deletedAt)
            ),
            columns: { id: true, email: true, name: true },
          });
        }

        // If not found by email, try by name trigram hashes
        if (!pgUser && mongoUser.fullName) {
          const nameTrigramHashes = hashTrigrams(mongoUser.fullName.toLowerCase());
          pgUser = await db.query.users.findFirst({
            where: and(
              sql`name_trigram_hashes @> ARRAY[${sql.join(
                nameTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              sql`name_trigram_hashes <@ ARRAY[${sql.join(
                nameTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(users.deletedAt)
            ),
            columns: { id: true, email: true, name: true },
          });
        }

        // If not found by name, try by phone trigram hashes
        if (!pgUser && mongoUser.phone) {
          const phoneTrigramHashes = hashTrigrams(mongoUser.phone);
          pgUser = await db.query.users.findFirst({
            where: and(
              sql`phone_trigram_hashes @> ARRAY[${sql.join(
                phoneTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              sql`phone_trigram_hashes <@ ARRAY[${sql.join(
                phoneTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(users.deletedAt)
            ),
            columns: { id: true, email: true, name: true },
          });
        }

        // If not found by phone, try by PPS number trigram hashes
        if (!pgUser && mongoUser.ppsNumber) {
          const ppsNumberTrigramHashes = hashTrigrams(mongoUser.ppsNumber);
          pgUser = await db.query.users.findFirst({
            where: and(
              sql`pps_number_trigram_hashes @> ARRAY[${sql.join(
                ppsNumberTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              sql`pps_number_trigram_hashes <@ ARRAY[${sql.join(
                ppsNumberTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(users.deletedAt)
            ),
            columns: { id: true, email: true, name: true },
          });
        }

        if (pgUser) {
          // Update MongoDB with PostgreSQL user ID
          await UserModel.updateOne({ _id: mongoUser._id }, { $set: { pgUserId: pgUser.id } });

          console.log(
            `  ✅ Updated MongoDB user ${mongoUser._id} with PostgreSQL ID: ${pgUser.id}`
          );

          // If user is married and has spouse details, try to find spouse too
          if (
            mongoUser.maritalStatus === 'Married' &&
            mongoUser.spouseDetails &&
            mongoUser.spouseDetails.fullName
          ) {
            try {
              const spouseNameTrigramHashes = hashTrigrams(
                mongoUser.spouseDetails.fullName.toLowerCase()
              );
              const spousePgUser = await db.query.users.findFirst({
                where: and(
                  sql`name_trigram_hashes @> ARRAY[${sql.join(
                    spouseNameTrigramHashes.map((h) => sql`${h}`),
                    sql`, `
                  )}]::text[]`,
                  sql`name_trigram_hashes <@ ARRAY[${sql.join(
                    spouseNameTrigramHashes.map((h) => sql`${h}`),
                    sql`, `
                  )}]::text[]`,
                  isNull(users.deletedAt)
                ),
                columns: { id: true, email: true, name: true },
              });

              if (spousePgUser) {
                await UserModel.updateOne(
                  {
                    _id: mongoUser._id,
                    'spouseDetails.fullName': mongoUser.spouseDetails.fullName,
                  },
                  { $set: { 'spouseDetails.pgUserId': spousePgUser.id } }
                );
                console.log(`  ✅ Updated spouse with PostgreSQL ID: ${spousePgUser.id}`);
              }
            } catch (spouseError) {
              console.log(`  ⚠️ Could not update spouse: ${spouseError}`);
            }
          }

          stats.successfulFixes++;
        } else {
          console.log(`  ❌ No matching PostgreSQL user found for MongoDB user ${mongoUser._id}`);
          stats.errors.push({
            mongoId: mongoUser._id.toString(),
            error: 'No matching PostgreSQL user found',
            timestamp: new Date(),
          });
          stats.failedFixes++;
        }

        // Progress update every 10 users
        if ((stats.successfulFixes + stats.failedFixes) % 10 === 0) {
          console.log(
            `📈 Progress: ${stats.successfulFixes + stats.failedFixes}/${stats.totalMissingPgUserId} processed`
          );
        }
      } catch (error) {
        console.error(`❌ Error processing user ${mongoUser._id}:`, error);
        stats.errors.push({
          mongoId: mongoUser._id.toString(),
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
        stats.failedFixes++;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX PGUSER ID SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Missing: ${stats.totalMissingPgUserId}`);
    console.log(`✅ Successfully Fixed: ${stats.successfulFixes}`);
    console.log(`❌ Failed to Fix: ${stats.failedFixes}`);
    console.log(
      `📈 Success Rate: ${stats.totalMissingPgUserId > 0 ? ((stats.successfulFixes / stats.totalMissingPgUserId) * 100).toFixed(2) : '0'}%`
    );
    console.log(
      `⏱️  Duration: ${Math.round((new Date().getTime() - stats.startTime.getTime()) / 1000)} seconds`
    );

    if (stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. MongoDB ID ${error.mongoId}: ${error.error}`);
      });
    }

    console.log('='.repeat(60));
  } catch (error) {
    console.error('💥 Fix operation failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  console.log('🛠️  Starting pgUserId fix operation...\n');
  fixMissingPgUserIds()
    .then(() => {
      console.log('🎉 Fix operation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { fixMissingPgUserIds };
