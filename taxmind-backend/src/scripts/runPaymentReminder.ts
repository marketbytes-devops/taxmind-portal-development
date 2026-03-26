#!/usr/bin/env ts-node
/**
 * Manual Payment Reminder Job Runner
 *
 * Use this script to manually execute the payment reminder job for testing or one-off runs.
 *
 * Usage:
 * npm run script:payment-reminder
 * or
 * ts-node src/scripts/runPaymentReminder.ts
 */
import 'module-alias/register';

import { checkDbConnection } from '@/database';
import logger from '@/logger';

import { executePaymentReminderJob, getPaymentReminderStats } from './paymentReminderJob';

async function runPaymentReminderJob() {
  try {
    logger.info('Starting manual payment reminder job execution...');

    // Check database connection
    const isDbConnected = await checkDbConnection();
    if (!isDbConnected) {
      logger.error('Database connection failed. Aborting payment reminder job.');
      process.exit(1);
    }

    // Get current stats before running
    const statsBefore = await getPaymentReminderStats();
    logger.info('Payment reminder stats before execution:', statsBefore);

    // Execute the payment reminder job
    const jobStats = await executePaymentReminderJob();

    // Get stats after running
    const statsAfter = await getPaymentReminderStats();
    logger.info('Payment reminder stats after execution:', statsAfter);

    // Log final results
    logger.info('Payment reminder job completed successfully', {
      jobStats,
      statsBefore,
      statsAfter,
      timestamp: new Date().toISOString(),
    });

    if (jobStats.remindersSent === 0) {
      logger.info('No payment reminders needed to be sent at this time.');
    } else {
      logger.info(`Successfully sent ${jobStats.remindersSent} payment reminder emails.`);
    }

    if (jobStats.errors > 0) {
      logger.warn(`${jobStats.errors} payment reminder emails failed to send.`);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Payment reminder job failed:', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

// Run the job if this script is executed directly
if (require.main === module) {
  runPaymentReminderJob();
}

export { runPaymentReminderJob };
