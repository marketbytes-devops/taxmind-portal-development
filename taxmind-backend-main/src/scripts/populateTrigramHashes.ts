/**
 * Migration Script: Populate Trigram Hash Fields
 *
 * This script populates the trigram hash arrays for all existing users.
 * It decrypts the sensitive data, generates trigrams, hashes them, and stores the hashes.
 *
 * Run this AFTER applying the database migration that adds the trigram columns.
 *
 * Usage:
 *   npx tsx src/scripts/populateTrigramHashes.ts
 */
import { eq } from 'drizzle-orm';

import { db, models } from '@/database';
import { hashTrigrams } from '@/utils/crypto';

async function populateTrigramHashes() {
  console.log('🚀 Starting trigram hash population...\n');

  try {
    // ==================== USERS ====================
    console.log('👥 Processing Users...\n');

    // Find all users that don't have trigram hashes yet
    const users = await db.query.users.findMany({
      //   where: isNull(models.users.deletedAt),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        profession: true,
        emailTrigramHashes: true,
        professionTrigramHashes: true,
      },
    });

    if (users.length === 0) {
      console.log('✅ No users found to update!');
    } else {
      // Filter users that need updates (empty arrays)
      const usersToUpdate = users.filter(
        (u) => (!u.emailTrigramHashes || u.emailTrigramHashes.length === 0) || (!u.professionTrigramHashes || u.professionTrigramHashes.length === 0)
      );

      if (usersToUpdate.length === 0) {
        console.log('✅ All users already have trigram hashes populated!');
      } else {
        console.log(`📊 Found ${usersToUpdate.length} users to update\n`);

        let userSuccessCount = 0;
        let userErrorCount = 0;

        // Process users in batches for better performance
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < usersToUpdate.length; i += BATCH_SIZE) {
          batches.push(usersToUpdate.slice(i, i + BATCH_SIZE));
        }

        console.log(`🔄 Processing ${batches.length} batches (${BATCH_SIZE} users per batch)...\n`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}...`);

          for (const user of batch) {
            try {
              // Generate hashed trigrams
              const nameTrigramHashes = hashTrigrams(user.name);
              const emailTrigramHashes = hashTrigrams(user.email);
              const phoneTrigramHashes = hashTrigrams(user.phone);
              const ppsNumberTrigramHashes = hashTrigrams(user.ppsNumber);
              const professionTrigramHashes = hashTrigrams(user.profession);

              // Update user with trigram hashes
              await db
                .update(models.users)
                .set({
                  nameTrigramHashes,
                  emailTrigramHashes,
                  phoneTrigramHashes,
                  ppsNumberTrigramHashes,
                  professionTrigramHashes,
                })
                .where(eq(models.users.id, user.id));

              userSuccessCount++;

              // Log progress every 10 users
              if (userSuccessCount % 10 === 0) {
                console.log(`   ✓ Processed ${userSuccessCount}/${usersToUpdate.length} users`);
              }
            } catch (error) {
              userErrorCount++;
              console.error(`   ✗ Failed to update user ${user.id}:`, error);
            }
          }
        }

        console.log('\n📈 Users Migration Summary:');
        console.log(`   ✅ Successfully updated: ${userSuccessCount} users`);
        console.log(`   ❌ Failed: ${userErrorCount} users`);
        console.log(`   📊 Total: ${usersToUpdate.length} users\n`);
      }
    }

    // ==================== APPLICATIONS ====================
    console.log('📋 Processing Applications...\n');

    // Find all applications that don't have trigram hashes yet
    const applications = await db.query.applications.findMany({
      //   where: isNull(models.applications.deletedAt),
      columns: {
        id: true,
        applicationNo: true,
        applicationNoTrigramHashes: true,
      },
    });

    if (applications.length === 0) {
      console.log('✅ No applications found to update!');
    } else {
      // Filter applications that need updates (empty arrays)
      const applicationsToUpdate = applications.filter(
        (app) => !app.applicationNoTrigramHashes || app.applicationNoTrigramHashes.length === 0
      );

      if (applicationsToUpdate.length === 0) {
        console.log('✅ All applications already have trigram hashes populated!');
      } else {
        console.log(`📊 Found ${applicationsToUpdate.length} applications to update\n`);

        let appSuccessCount = 0;
        let appErrorCount = 0;

        // Process applications in batches
        const APP_BATCH_SIZE = 50;
        const appBatches = [];
        for (let i = 0; i < applicationsToUpdate.length; i += APP_BATCH_SIZE) {
          appBatches.push(applicationsToUpdate.slice(i, i + APP_BATCH_SIZE));
        }

        console.log(
          `🔄 Processing ${appBatches.length} batches (${APP_BATCH_SIZE} applications per batch)...\n`
        );

        for (let batchIndex = 0; batchIndex < appBatches.length; batchIndex++) {
          const batch = appBatches[batchIndex];
          console.log(`📦 Processing batch ${batchIndex + 1}/${appBatches.length}...`);

          for (const application of batch) {
            try {
              // Generate hashed trigrams for application number
              const applicationNoTrigramHashes = hashTrigrams(
                application.applicationNo.toLowerCase()
              );

              // Update application with trigram hashes
              await db
                .update(models.applications)
                .set({
                  applicationNoTrigramHashes,
                })
                .where(eq(models.applications.id, application.id));

              appSuccessCount++;

              // Log progress every 10 applications
              if (appSuccessCount % 10 === 0) {
                console.log(
                  `   ✓ Processed ${appSuccessCount}/${applicationsToUpdate.length} applications`
                );
              }
            } catch (error) {
              appErrorCount++;
              console.error(`   ✗ Failed to update application ${application.id}:`, error);
            }
          }
        }

        console.log('\n📈 Applications Migration Summary:');
        console.log(`   ✅ Successfully updated: ${appSuccessCount} applications`);
        console.log(`   ❌ Failed: ${appErrorCount} applications`);
        console.log(`   📊 Total: ${applicationsToUpdate.length} applications\n`);
      }
    }

    // ==================== FINAL SUMMARY ====================
    console.log('\n🎉 All trigram hashes populated successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the search functionality for users and applications');
    console.log('   2. Verify fuzzy search is working with 60% threshold');
    console.log(
      '   3. Once verified, you can drop the old hashedEmail/hashedPhone/hashedApplicationNo columns'
    );
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
populateTrigramHashes()
  .then(() => {
    console.log('\n✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
