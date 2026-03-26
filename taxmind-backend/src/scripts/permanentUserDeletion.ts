/**
 * Permanent User Deletion Cron Job
 *
 * This script permanently deletes user accounts and all associated data
 * after 6 years from the deletedAt timestamp (GDPR compliance).
 *
 * Run schedule: Daily at 2:00 AM
 * Retention period: 6 years (2190 days)
 */
import { subYears } from 'date-fns';
import { and, eq, inArray, isNotNull, lt } from 'drizzle-orm';

import { db, models } from '@/database';
import { deleteFile } from '@/integrations/awsS3';
import logger from '@/logger';

// 6 years retention period
const RETENTION_YEARS = 6;

interface UserToDelete {
  id: string;
  deletedAt: Date;
  hashedEmail: string;
}

interface DeletionStats {
  usersProcessed: number;
  usersDeleted: number;
  errors: string[];
}

/**
 * Find users eligible for permanent deletion
 * (deletedAt is not null and is older than 6 years)
 */
async function findUsersForPermanentDeletion(): Promise<UserToDelete[]> {
  const cutoffDate = subYears(new Date(), RETENTION_YEARS);

  const users = await db.query.users.findMany({
    where: and(isNotNull(models.users.deletedAt), lt(models.users.deletedAt, cutoffDate)),
    columns: {
      id: true,
      deletedAt: true,
    },
    limit: 100, // Process in batches to avoid memory issues
  });

  return users.filter((user) => user.deletedAt !== null) as UserToDelete[];
}

/**
 * Permanently delete a user and all associated data
 */
async function permanentlyDeleteUser(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    logger.info(`Starting permanent deletion for user: ${userId}`);

    // Step 1: Collect all file IDs related to this user for S3 deletion
    const allFileIds: string[] = [];

    // Get files uploaded by user
    const userUploadedFiles = await tx.query.files.findMany({
      where: eq(models.files.uploadedBy, userId),
      columns: { id: true, key: true },
    });
    allFileIds.push(...userUploadedFiles.map((f) => f.id));

    // Get all applications for this user to find related files
    const userApplications = await tx.query.applications.findMany({
      where: eq(models.applications.userId, userId),
      columns: { id: true, taxReturnDocumentId: true },
    });

    // Add tax return document IDs
    const taxReturnDocIds = userApplications
      .filter((app) => app.taxReturnDocumentId)
      .map((app) => app.taxReturnDocumentId as string);
    allFileIds.push(...taxReturnDocIds);

    const userApplicationIds = userApplications.map((app) => app.id);

    // Get application document categories and their files
    if (userApplicationIds.length > 0) {
      const applicationDocCategories = await tx.query.applicationDocumentCategories.findMany({
        where: inArray(models.applicationDocumentCategories.applicationId, userApplicationIds),
        columns: { id: true },
      });
      const docCategoryIds = applicationDocCategories.map((cat) => cat.id);

      if (docCategoryIds.length > 0) {
        // Get all files linked to application document categories
        const docCategoryFiles = await tx.query.applicationDocumentCategoryFiles.findMany({
          where: inArray(
            models.applicationDocumentCategoryFiles.applicationDocumentCategoryId,
            docCategoryIds
          ),
          columns: { fileId: true },
        });
        allFileIds.push(...docCategoryFiles.map((dcf) => dcf.fileId));
      }
    }

    // Get all chats for this user to find attached files
    const userChats = await tx.query.chats.findMany({
      where: eq(models.chats.userId, userId),
      columns: { id: true, fileId: true },
    });
    const chatFileIds = userChats
      .filter((chat) => chat.fileId)
      .map((chat) => chat.fileId as string);
    allFileIds.push(...chatFileIds);

    // Get unique file IDs
    const uniqueFileIds = [...new Set(allFileIds)];
    logger.info(`Found ${uniqueFileIds.length} files to delete from S3 for user ${userId}`);

    // Fetch all files with their S3 keys
    if (uniqueFileIds.length > 0) {
      const filesToDelete = await tx.query.files.findMany({
        where: inArray(models.files.id, uniqueFileIds),
        columns: { id: true, key: true, fileName: true },
      });

      // Delete files from S3 bucket
      let s3DeletedCount = 0;
      for (const file of filesToDelete) {
        if (file.key) {
          try {
            await deleteFile(file.key);
            s3DeletedCount++;
            logger.debug(`Deleted file from S3: ${file.fileName} (${file.key})`);
          } catch (error) {
            logger.error(`Failed to delete file from S3: ${file.fileName} (${file.key})`, error);
            // Continue even if S3 deletion fails
          }
        }
      }
      logger.info(`Successfully deleted ${s3DeletedCount} files from S3 for user ${userId}`);
    }

    // Step 2: Handle spouse relationships before deletion
    // Check if this user is a parent (has children/spouse)
    const children = await tx.query.users.findMany({
      where: eq(models.users.parentId, userId),
      columns: { id: true },
    });

    if (children.length > 0) {
      logger.info(
        `User ${userId} has ${children.length} child account(s) (spouse). Updating spouse relationships...`
      );
      // Remove parent reference from children and update their marital status to single
      for (const child of children) {
        await tx
          .update(models.users)
          .set({
            parentId: null,
            maritalStatus: 'single',
            updatedAt: new Date(),
          })
          .where(eq(models.users.id, child.id));
        logger.debug(`Updated child account ${child.id} - removed parent and set to single`);
      }
    }

    // Check if this user is a child (has a parent/spouse)
    const userDetails = await tx.query.users.findFirst({
      where: eq(models.users.id, userId),
      columns: { id: true, parentId: true },
    });

    if (userDetails?.parentId) {
      logger.info(`User ${userId} is a child account. Updating parent's marital status...`);
      // Update parent's marital status to single
      await tx
        .update(models.users)
        .set({
          maritalStatus: 'single',
          updatedAt: new Date(),
        })
        .where(eq(models.users.id, userDetails.parentId));
      logger.debug(`Updated parent account ${userDetails.parentId} - set marital status to single`);
    }

    // Step 3: Delete the user - all related data will cascade automatically
    // - applications (and all nested: questionnaireResponses, questionResponses,
    //   applicationDocumentCategories, applicationDocumentCategoryFiles,
    //   applicationStatusHistories, applicationNotes, applicationReviews,
    //   payments, offlinePaymentRequests, application-related chats)
    // - chats (and adminReadChats)
    // - whatsappChats (and adminReadWhatsappChats)
    // - userNotifications
    // - userPolicyAcceptances
    // - agentActivations
    // - files (database records only, S3 files already deleted above)
    await tx.delete(models.users).where(eq(models.users.id, userId));

    logger.info(
      `Permanently deleted user ${userId} and all associated data via cascade constraints`
    );
  });
}

/**
 * Main execution function
 */
export async function executeUserDeletionJob(): Promise<DeletionStats> {
  const stats: DeletionStats = {
    usersProcessed: 0,
    usersDeleted: 0,
    errors: [],
  };

  try {
    logger.info('Starting permanent user deletion job...');

    const usersToDelete = await findUsersForPermanentDeletion();
    stats.usersProcessed = usersToDelete.length;

    if (usersToDelete.length === 0) {
      logger.info('No users found for permanent deletion');
      return stats;
    }

    logger.info(`Found ${usersToDelete.length} users eligible for permanent deletion`);

    // Process each user
    for (const user of usersToDelete) {
      try {
        await permanentlyDeleteUser(user.id);
        stats.usersDeleted++;

        logger.info(
          `Successfully deleted user ${user.id} (deleted on: ${user.deletedAt.toISOString()})`
        );
      } catch (error) {
        const errorMsg = `Failed to delete user ${user.id}: ${(error as Error).message}`;
        logger.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    logger.info(
      `User deletion job completed. Processed: ${stats.usersProcessed}, Deleted: ${stats.usersDeleted}, Errors: ${stats.errors.length}`
    );

    return stats;
  } catch (error) {
    const errorMsg = `User deletion job failed: ${(error as Error).message}`;
    logger.error(errorMsg);
    stats.errors.push(errorMsg);
    throw error;
  }
}

/**
 * Run the job if this file is executed directly
 */
if (require.main === module) {
  executeUserDeletionJob()
    .then((stats) => {
      console.log('Job completed successfully:', stats);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Job failed:', error);
      process.exit(1);
    });
}
