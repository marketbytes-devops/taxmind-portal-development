/**
 * User Phone Number Update Job
 *
 * Updates phone numbers for all users based on Irish phone number formatting:
 * 1. If phone number has 10 digits starting with 0, omit 0 and add "+353" prefix
 * 2. If phone number has 9 digits, add "+353" prefix
 *
 * This script handles encrypted phone numbers and updates both the encrypted value
 * and the hashed value for search purposes.
 */
import dotenv from 'dotenv';
import { eq, isNotNull } from 'drizzle-orm';

import { db, models } from '@/database';
import logger from '@/logger';
import { hashTrigrams } from '@/utils/crypto';

// Load environment variables
dotenv.config();

interface PhoneUpdateStats {
  totalUsers: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Normalizes Irish phone numbers according to the specified rules
 */
function normalizePhoneNumber(phoneNumber: string): { updated: string; changed: boolean } {
  // Remove all spaces, dashes, and parentheses
  const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');

  // Early check: If already correctly formatted, just clean up formatting if needed
  if (cleanPhone.startsWith('+353') && (cleanPhone.length === 12 || cleanPhone.length === 13)) {
    return {
      updated: cleanPhone,
      changed: phoneNumber !== cleanPhone, // Only changed if we cleaned up formatting
    };
  }

  // Remove existing country codes if present for processing
  let phone = cleanPhone;
  if (phone.startsWith('+353')) {
    phone = phone.substring(4);
  } else if (phone.startsWith('00353')) {
    phone = phone.substring(5);
  } else if (phone.startsWith('353')) {
    phone = phone.substring(3);
  }

  // Rule 1: 10 digits starting with 0 -> remove 0 and add +353
  if (phone.length === 10 && phone.startsWith('0')) {
    return {
      updated: '+353' + phone.substring(1),
      changed: true,
    };
  }
  // Rule 2: 9 digits -> add +353 prefix
  else if (phone.length === 9) {
    return {
      updated: '+353' + phone,
      changed: true,
    };
  }

  // No transformation needed/possible
  return { updated: phoneNumber, changed: false };
}

/**
 * Execute phone number update job
 */
export async function executePhoneNumberUpdateJob(): Promise<PhoneUpdateStats> {
  const stats: PhoneUpdateStats = {
    totalUsers: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    logger.info('Starting phone number update job...');

    // Fetch all users with phone numbers (not null and not empty)
    const users = await db
      .select({
        id: models.users.id,
        phone: models.users.phone,
      })
      .from(models.users)
      .where(isNotNull(models.users.phone));

    stats.totalUsers = users.length;
    logger.info(`Found ${stats.totalUsers} users to process`);

    for (const user of users) {
      try {
        // Check if phone is null, undefined, or empty string
        if (!user.phone || user.phone.trim() === '') {
          logger.debug(`Skipping user ${user.id}: phone is null or empty`);
          stats.skipped++;
          continue;
        }

        // Phone numbers should be auto-decrypted by Drizzle, but handle both cases
        const currentPhone = user.phone;
        logger.debug(`Processing user ${user.id}: ${currentPhone}`);

        // Apply phone number normalization
        const { updated: normalizedPhone, changed } = normalizePhoneNumber(currentPhone);

        if (changed) {
          // Create hash for search purposes
          const phoneTrigramHashes = hashTrigrams(normalizedPhone);

          // Update the user's phone number in the database
          // Drizzle will automatically encrypt the phone number via customEncryptedType
          await db
            .update(models.users)
            .set({
              phone: normalizedPhone, // Drizzle handles encryption automatically
              phoneTrigramHashes,
              updatedAt: new Date(),
            })
            .where(eq(models.users.id, user.id));

          logger.info(`Updated user ${user.id}: ${currentPhone} -> ${normalizedPhone}`);
          stats.updated++;
        } else {
          logger.debug(`Skipped user ${user.id}: ${currentPhone} (no change needed)`);
          stats.skipped++;
        }
      } catch (error) {
        logger.error(`Error processing user ${user.id}:`, error);
        stats.errors++;
      }
    }

    logger.info('Phone number update job completed', {
      totalUsers: stats.totalUsers,
      updated: stats.updated,
      skipped: stats.skipped,
      errors: stats.errors,
    });

    return stats;
  } catch (error) {
    logger.error('Failed to execute phone number update job:', error);
    throw error;
  }
}

/**
 * Main function to run the script with nice formatting
 */
async function main() {
  console.log('🚀 Starting Irish phone number normalization script...\n');

  try {
    const stats = await executePhoneNumberUpdateJob();

    console.log('\n✅ Phone number update completed successfully!');
    console.log('📊 Summary:');
    console.log(`   📱 Total users: ${stats.totalUsers}`);
    console.log(`   ✏️  Updated: ${stats.updated}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   ❌ Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\n⚠️  Some errors occurred. Check logs for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All phone numbers processed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}
