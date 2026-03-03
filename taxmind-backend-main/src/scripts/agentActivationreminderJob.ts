import { and, eq, isNull,lt, sql, or } from 'drizzle-orm';

import { db, models } from '@/database';
import logger from '@/logger';
import { mail } from '@/mail/handler';

interface AgentActivationReminderStats {
  totalAgentActivationRequests: number;
  remindersSent: number;
  errors: number;
}

interface UserToNotify {
  id: string;
  name: string;
  email: string;
}

const BATCH_SIZE = 100;

export async function executeAgentActivationReminderJob(): Promise<AgentActivationReminderStats> {
  const stats: AgentActivationReminderStats = {
    totalAgentActivationRequests: 0,
    remindersSent: 0,
    errors: 0,
  };

  try {
    logger.info('Starting agent activation reminder email job...');

    let offset = 0;

    while (true) {
      const usersToNotify = await findUsersForAgentActivationReminder(offset, BATCH_SIZE);

      if (usersToNotify.length === 0) {
        break; // no more users
      }

      stats.totalAgentActivationRequests += usersToNotify.length;

      for (const user of usersToNotify) {
        try {
          if (!user.email || !user.name) {
            logger.warn('Skipping user due to missing user email or name', {
              userId: user.id,
            });
            continue;
          }

          await mail.taxAgentRequest({
            recipient: user.email,
            replacements: { name: user.name },
          });

          // Update the last reminder timestamp and increment counter
          await db.execute(
            sql`UPDATE users 
                SET last_agent_activation_reminder_sent_at = ${new Date().toISOString()},
                    agent_activation_reminder_sent_count = agent_activation_reminder_sent_count + 1,
                    updated_at = ${new Date().toISOString()}
                WHERE id = ${user.id}`
          );

          stats.remindersSent++;

          logger.info('Agent activation reminder sent successfully', {
            userId: user.id,
            userEmail: user.email,
          });
        } catch (err) {
          stats.errors++;
          logger.error('Failed to send reminder', {
            userId: user.id,
            error: (err as Error).message,
          });
        }
      }

      offset += BATCH_SIZE;
    }

    return stats;
  } catch (error) {
    logger.error('Agent activation reminder job failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

async function findUsersForAgentActivationReminder(
  offset: number,
  limit: number
): Promise<UserToNotify[]> {
   // Calculate date 7 days ago for comparison
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const users = await db.query.users.findMany({
    where: and(
      isNull(models.users.deletedAt),
      eq(models.users.isTaxAgentVerificationRequestSent, true),
      eq(models.users.isTaxAgentVerificationCompleted, false),
      lt(models.users.agentActivationReminderSentCount, 4),
      or(
        sql`users.last_agent_activation_reminder_sent_at IS NULL`,
        sql`users.last_agent_activation_reminder_sent_at < ${sevenDaysAgo.toISOString()}`
      )
    ),
    columns: {
      id: true,
      email: true,
      name: true,
    },
    limit,
    offset,
    orderBy: (users, { asc }) => [asc(users.id)],
  });

  return users as UserToNotify[];
}
