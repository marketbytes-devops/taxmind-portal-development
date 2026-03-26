import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/database';
import { models } from '@/database';
import  logger  from '@/logger';

/**
 * Script to update all payments with status 'pending' to 'failed' if they are older than 1 hour
 * This handles abandoned/stuck payment sessions that were never completed
 */
export async function updateExpiredPendingPayments() {
  try {
    logger.info('Starting expired pending payments update job');

    // Calculate timestamp for 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    logger.info(`Searching for pending payments older than ${oneHourAgo.toISOString()}`);

    // Find all pending payments older than 1 hour
    const expiredPayments = await db.query.payments.findMany({
      where: and(
        eq(models.payments.status, 'pending'),
        lt(models.payments.createdAt, oneHourAgo)
      ),
      columns: {
        id: true,
        transactionNo: true,
        applicationId: true,
        userId: true,
        amount: true,
        createdAt: true,
      },
    });

    if (expiredPayments.length === 0) {
      logger.info('No expired pending payments found');
      return;
    }

    logger.info(`Found ${expiredPayments.length} expired pending payment(s) to update`);

    // Log payment details before bulk update
    expiredPayments.forEach((payment) => {
      logger.info(
        `Marking payment ${payment.transactionNo} (ID: ${payment.id}) as failed. ` +
          `Amount: ${payment.amount}, Created: ${payment.createdAt.toISOString()}`
      );
    });

    // Bulk update all expired payments to failed status in a single query
    await db
      .update(models.payments)
      .set({
        status: 'failed',
        updatedAt: new Date(),
        processedAt: new Date(),
        failureReason: 'Payment Failed - Session Expired',

      })
      .where(
        and(eq(models.payments.status, 'pending'), lt(models.payments.createdAt, oneHourAgo))
      );

    logger.info(
      `Successfully updated ${expiredPayments.length} expired pending payment(s) to failed status`
    );
  } catch (error) {
    logger.error('Error updating expired pending payments:', error);
    throw error;
  }
}

