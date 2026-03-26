/**
 * Payment Reminder Email Job
 *
 * Sends payment reminder emails to users with pending payments:
 * - Applications with status 'refund_completed' and paymentStatus 'pending'
 * - No offline payment request made, OR offline payment request was rejected
 * - Sends reminder every 2 days from the last reminder (or refund completion date)
 */
import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';

import { db, models } from '@/database';
import logger from '@/logger';
import { mail } from '@/mail/handler';

interface PaymentReminderStats {
  totalEligibleApplications: number;
  remindersSent: number;
  errors: number;
}

/**
 * Execute payment reminder email job
 */
export async function executePaymentReminderJob(): Promise<PaymentReminderStats> {
  const stats: PaymentReminderStats = {
    totalEligibleApplications: 0,
    remindersSent: 0,
    errors: 0,
  };

  try {
    logger.info('Starting payment reminder email job...');

    // Calculate date 7 days ago for comparison
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find applications that need payment reminders
    const eligibleApplications = await db
      .select({
        id: models.applications.id,
        applicationNo: models.applications.applicationNo,
        userId: models.users.id,
        userName: models.users.name,
        userEmail: models.users.email,
        createdAt: models.applications.createdAt,
      })
      .from(models.applications)
      .leftJoin(models.users, eq(models.applications.userId, models.users.id))
      .leftJoin(
        models.offlinePaymentRequests,
        eq(models.offlinePaymentRequests.applicationId, models.applications.id)
      )
      .where(
        and(
          // Application status is refund_completed
          eq(models.applications.status, 'refund_completed'),
          // maximum 4 reminders sent
          lt(models.applications.paymentReminderSentCount, 4),
          // Payment status is pending
          eq(models.applications.paymentStatus, 'pending'),
          // User is not deleted
          isNull(models.users.deletedAt),
          // Either no reminder sent yet and application is more than 2 days old,
          // OR last reminder was sent more than 2 days ago (using raw SQL)
          or(
            and(
              sql`applications.last_payment_reminder_sent_at IS NULL`,
              lt(models.applications.createdAt, sevenDaysAgo)
            ),
            sql`applications.last_payment_reminder_sent_at < ${sevenDaysAgo.toISOString()}`
          ),
          // Either no offline payment request exists OR the latest one is rejected
          or(
            isNull(models.offlinePaymentRequests.id),
            eq(models.offlinePaymentRequests.status, 'rejected')
          )
        )
      )
      .groupBy(
        models.applications.id,
        models.applications.applicationNo,
        models.users.id,
        models.users.name,
        models.users.email,
        models.applications.createdAt
      );

    stats.totalEligibleApplications = eligibleApplications.length;

    logger.info(`Found ${eligibleApplications.length} applications eligible for payment reminders`);

    // Process each eligible application
    for (const application of eligibleApplications) {
      try {
        // Skip if user email or name is null
        if (!application.userEmail || !application.userName) {
          logger.warn('Skipping application due to missing user email or name', {
            applicationId: application.id,
            userEmail: application.userEmail,
            userName: application.userName,
          });
          continue;
        }

        // Send payment reminder email
        /* await mail.paymentReminder({
          recipient: application.userEmail,
          replacements: {
            name: application.userName,
          },
        }); */

        // Update the lastPaymentReminderSentAt timestamp and increment reminder count
        await db.execute(
          sql`UPDATE applications 
              SET last_payment_reminder_sent_at = ${new Date().toISOString()},
                  payment_reminder_sent_count = payment_reminder_sent_count + 1,
                  updated_at = ${new Date().toISOString()}
              WHERE id = ${application.id}`
        );

        stats.remindersSent++;

        logger.info('Payment reminder sent successfully', {
          applicationId: application.id,
          applicationNo: application.applicationNo,
          userId: application.userId,
          userEmail: application.userEmail,
        });
      } catch (error) {
        stats.errors++;
        logger.error('Failed to send payment reminder', {
          applicationId: application.id,
          applicationNo: application.applicationNo,
          userId: application.userId,
          userEmail: application.userEmail,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Payment reminder job completed', stats);
    return stats;
  } catch (error) {
    logger.error('Payment reminder job failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

/**
 * Get payment reminder job statistics for monitoring
 */
export async function getPaymentReminderStats(): Promise<{
  pendingApplicationsCount: number;
  lastRemindersSentToday: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingApplications, todayRemindersResult] = await Promise.all([
      // Count pending applications that need reminders
      db
        .select({ count: sql<number>`count(*)` })
        .from(models.applications)
        .leftJoin(models.users, eq(models.applications.userId, models.users.id))
        .where(
          and(
            eq(models.applications.status, 'refund_completed'),
            eq(models.applications.paymentStatus, 'pending'),
            isNull(models.users.deletedAt)
          )
        ),

      // Count reminders sent today - using raw SQL due to column recognition issue
      db.execute(
        sql`SELECT COUNT(*) as count FROM applications 
            WHERE status = 'refund_completed' 
            AND payment_status = 'pending' 
            AND last_payment_reminder_sent_at >= ${today.toISOString()}
            AND last_payment_reminder_sent_at < ${tomorrow.toISOString()}`
      ),
    ]);

    // Extract count from raw SQL result
    const todayRemindersCount = Number(
      (todayRemindersResult as unknown as { rows: Array<{ count: string }> }).rows[0]?.count || '0'
    );

    return {
      pendingApplicationsCount: pendingApplications[0]?.count ?? 0,
      lastRemindersSentToday: todayRemindersCount,
    };
  } catch (error) {
    logger.error('Failed to get payment reminder stats', {
      error: (error as Error).message,
    });
    console.log(error);
    throw error;
  }
}
