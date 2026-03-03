/**
 * Cron Scheduler for  Tasks
 *
 * This module sets up scheduled tasks for:
 * - Permanent deletion of user accounts after 6 years
 * - Other compliance-related cleanup tasks
 *
 * Uses node-cron for precise scheduling
 */
import * as cron from 'node-cron';

import logger from '@/logger';

import { executeAgentActivationReminderJob } from './agentActivationreminderJob';
import { executePaymentReminderJob } from './paymentReminderJob';
import { executeUserDeletionJob } from './permanentUserDeletion';
import { updateExpiredPendingPayments } from './updatePaymentToFailedStatue';

// Store cron tasks for management
const cronTasks: cron.ScheduledTask[] = [];

/**
 * Initialize all scheduled cron jobs
 */
export function initializeCronJobs(): void {
  // Permanent user deletion - runs daily at 2:00 AM Dublin time
  const deletionJob = cron.schedule(
    '0 2 * * *',
    async () => {
      logger.info('Starting scheduled permanent user deletion job...');

      try {
        const stats = await executeUserDeletionJob();

        logger.info('Scheduled user deletion job completed successfully', {
          stats,
          timestamp: new Date().toISOString(),
        });

        // Log warning if users were actually deleted
        if (stats.usersDeleted > 0) {
          logger.warn(`${stats.usersDeleted} user accounts permanently deleted`, stats);

          // TODO: Send admin notification email
          // await notifyAdmins('user_deletion_completed', stats);
        }
      } catch (error) {
        logger.error('Scheduled user deletion job failed', {
          error: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: new Date().toISOString(),
        });
      }
    },
    {
      timezone: 'Europe/Dublin', // Irish timezone for compliance
    }
  );

  // Payment reminder job - runs daily at 10:00 AM Dublin time
  const paymentReminderJob = cron.schedule(
    '0 10 * * *',
    async () => {
      logger.info('Starting scheduled payment reminder job...');

      try {
        const stats = await executePaymentReminderJob();

        logger.info('Scheduled payment reminder job completed successfully', {
          stats,
          timestamp: new Date().toISOString(),
        });

        // Log info if reminders were sent
        if (stats.remindersSent > 0) {
          logger.info(`${stats.remindersSent} payment reminder emails sent`, stats);
        }

        // Log warning if there were errors
        if (stats.errors > 0) {
          logger.warn(`${stats.errors} payment reminder emails failed to send`, stats);
        }
      } catch (error) {
        logger.error('Scheduled payment reminder job failed', {
          error: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: new Date().toISOString(),
        });
      }
    },
    {
      timezone: 'Europe/Dublin', // Irish timezone
    }
  );

  // Agent activation reminder job - runs At 10:00 on every day - Dublin time
  const agentActivationReminderJob = cron.schedule(
    '0 10 * * *',
    async () => {
      logger.info('Starting scheduled agent activation reminder job...');

      try {
        const stats = await executeAgentActivationReminderJob();

        logger.info('Scheduled agent activation reminder job completed successfully', {
          stats,
          timestamp: new Date().toISOString(),
        });

        // Log info if reminders were sent
        if (stats.remindersSent > 0) {
          logger.info(`${stats.remindersSent} agent activation reminder emails sent`, stats);
        }

        // Log warning if there were errors
        if (stats.errors > 0) {
          logger.warn(`${stats.errors} agent activation reminder emails failed to send`, stats);
        }
      } catch (error) {
        logger.error('Scheduled agent activation reminder job failed', {
          error: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: new Date().toISOString(),
        });
      }
    },
    {
      timezone: 'Europe/Dublin', // Irish timezone
    }
  );
  // Update expired pending payments job - runs every 1 hour
  const expiredPaymentsJob = cron.schedule(
    '0 * * * *',
    async () => {
      logger.info('Starting scheduled expired pending payments update job...');

      try {
        await updateExpiredPendingPayments();
      } catch (error) {
        logger.error('Scheduled expired pending payments update job failed', {
          error: (error as Error).message,
          stack: (error as Error).stack,
          timestamp: new Date().toISOString(),
        });
      }
    },
    {
      timezone: 'Europe/Dublin', // Irish timezone
    }
  );

  // Store tasks for management
  cronTasks.push(deletionJob, paymentReminderJob, agentActivationReminderJob, expiredPaymentsJob);

  logger.info('Cron jobs initialized with node-cron', {
    jobs: [
      'User deletion: Daily at 2:00 AM (Dublin)',
      'Payment reminders: Daily at 10:00 AM (Dublin)',
      'Agent activation reminders:  Daily at 10:00 AM (Dublin)',
      'Expired pending payments update: Hourly (Dublin)',
    ],
    timezone: 'Europe/Dublin',
  });
}

/**
 * Stop all cron jobs (useful for graceful shutdown)
 */
export function stopCronJobs(): void {
  cronTasks.forEach((task, index) => {
    if (task) {
      task.stop();
      logger.debug(`Stopped cron job ${index + 1}`);
    }
  });

  // Clear the tasks array
  cronTasks.length = 0;

  logger.info('All  cron jobs stopped');
}

/**
 * Get status of all cron jobs
 */
export function getCronJobsStatus(): Array<{ name: string; running: boolean }> {
  return [
    {
      name: 'User Deletion Job',
      running: cronTasks[0] ? true : false,
    },
    {
      name: 'Payment Reminder Job',
      running: cronTasks[1] ? true : false,
    },
  ];
}
