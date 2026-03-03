import { eq } from 'drizzle-orm';
import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, models, pool } from '@/database';
import {
  applicationStatusHistories,
  applications,
  files,
  questionResponses,
  questionnaireResponses,
} from '@/database/models';
import { hashWithHMAC } from '@/utils/crypto';

import defaults from '../default';
// These imports are needed for Mongoose models to be registered
import { ApplicationModel } from '../schema/application';
import { ApplicationQuestionnaireModel } from '../schema/applicationQuestionnaire';
import { ApplicationReviewModel } from '../schema/applicationReview';
import { DocumentCategoryModel } from '../schema/document-category';
import { UserModel } from '../schema/user';

// Type definitions for MongoDB documents
interface MongoApplication extends Document {
  _id: mongoose.Types.ObjectId;
  uid: mongoose.Types.ObjectId; // User ID
  applicationId: string;
  applicationIdNo: number;
  year: number;
  isNoDocumentToUpload: boolean;
  documents: Array<{
    categoryId: mongoose.Types.ObjectId;
    file: string;
    originalFileName: string;
    uploadDate: Date;
  }>;
  refundAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  promoCode: string;
  promoCodeDiscountPercentage: number;
  promoCodeDiscountAmount: number;
  vatPercentage: number;
  vatAmount: number;
  discountAmount: number;
  totalCommissionAmount: number;
  isQuestionnaireSubmitted: boolean;
  paymentStatus: 'PENDING' | 'INITIATE' | 'PAID' | 'FAILED';
  invoiceId: string;
  invoiceIdNo: number;
  status: 'SUBMITTED' | 'DOCUMENTS_UPLOADED' | 'PROCESSING' | 'APPROVED' | 'DELETED';
  statusHistory: Array<{
    status: string;
    updatedAt: Date;
  }>;
  create_date: Date;
  update_date: Date;
  pgApplicationId?: string; // Added for bidirectional linking
}

interface MongoApplicationQuestionnaire extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  pgQuestionnaireId: string;
  pgApplicationId?: string;
  allQuestionAnswers: Array<{
    category: string;
    pgQuestionnaireCategoryId: string;
    questions: Array<{
      question: string;
      answer: unknown;
      answerType: 'String' | 'Number' | 'Date' | 'Boolean';
      pgQuestionId: string;
    }>;
  }>;
  status: 'ACTIVE' | 'DELETED';
  create_date: Date;
  update_date: Date;
}

interface MongoUser extends Document {
  _id: mongoose.Types.ObjectId;
  pgUserId: string;
}

interface MigrationError {
  applicationId: string;
  error: string;
  mongoData: Partial<MongoApplication>;
  timestamp: Date;
}

// Configuration
class ApplicationMigrationConfig {
  public mongoUri: string;
  public mongoDbName: string;
  public pgConnectionString: string;

  constructor() {
    // Use MongoDB URI from defaults.js or environment variables
    this.mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_DEV || defaults.MONGO_URI_DEV;

    // Extract database name from URI or use environment variable
    this.mongoDbName =
      process.env.MONGO_DB_NAME || this.extractDbNameFromUri(this.mongoUri) || 'TaxMindDB_Test';

    this.pgConnectionString = process.env.DATABASE_URL;

    if (!this.pgConnectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    if (!this.mongoUri) {
      throw new Error(
        'MongoDB URI is required. Set MONGO_URI or MONGO_URI_DEV environment variable.'
      );
    }
  }

  // Extract database name from MongoDB URI
  private extractDbNameFromUri(uri: string): string | null {
    try {
      const match = uri.match(/\/([^?]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

// Migration Statistics
class ApplicationMigrationStats {
  public totalApplicationQuestionnaires: number = 0;
  public successfulApplicationMigrations: number = 0;
  public failedApplicationMigrations: number = 0;
  public skippedApplications: number = 0;
  public activeApplicationQuestionnaires: number = 0;
  public deletedApplicationQuestionnaires: number = 0;
  public questionnaireResponsesCreated: number = 0;
  public questionResponsesCreated: number = 0;
  public duplicateApplications: number = 0;
  public orphanedApplicationQuestionnaires: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    applicationId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoApplication> = {}
  ): void {
    this.errors.push({
      applicationId: applicationId.toString(),
      error: error instanceof Error ? error.message : String(error),
      mongoData,
      timestamp: new Date(),
    });
    this.failedApplicationMigrations++;
  }

  addSuccess(): void {
    this.successfulApplicationMigrations++;
  }

  addSkipped(): void {
    this.skippedApplications++;
  }

  addActive(): void {
    this.activeApplicationQuestionnaires++;
  }

  addDeleted(): void {
    this.deletedApplicationQuestionnaires++;
  }

  addQuestionnaireResponse(): void {
    this.questionnaireResponsesCreated++;
  }

  addQuestionResponse(): void {
    this.questionResponsesCreated++;
  }

  addDuplicate(): void {
    this.duplicateApplications++;
  }

  addOrphaned(): void {
    this.orphanedApplicationQuestionnaires++;
  }

  getSuccessRate(): string {
    if (this.totalApplicationQuestionnaires === 0) return '0.00';
    return (
      (this.successfulApplicationMigrations / this.totalApplicationQuestionnaires) *
      100
    ).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Application Migration Class
class ApplicationMigrator {
  private config: ApplicationMigrationConfig;
  private stats: ApplicationMigrationStats;
  private createdAdminId: string | null = null; // Will be set to first available admin ID

  constructor(config: ApplicationMigrationConfig) {
    this.config = config;
    this.stats = new ApplicationMigrationStats();
  }

  async connect(): Promise<void> {
    try {
      // Connect to MongoDB using Mongoose
      await mongoose.connect(this.config.mongoUri);
      console.log('✅ Connected to MongoDB successfully via Mongoose');

      // Test PostgreSQL connection using shared pool
      const pgClient: PoolClient = await pool.connect();
      pgClient.release();
      console.log('✅ Connected to PostgreSQL successfully');

      // Get first available admin for foreign key reference
      await this.getAvailableAdmin();
    } catch (error) {
      console.error('❌ Failed to establish database connections:', error);
      throw error;
    }
  }

  // Get first available admin ID for foreign key reference
  private async getAvailableAdmin(): Promise<string> {
    if (this.createdAdminId) return this.createdAdminId;

    try {
      // Find super admin in PostgreSQL
      const superAdminRole = await db.query.roles.findFirst({
        where: eq(models.roles.roleName, 'Super Admin'),
      });

      const superAdmin = await db.query.admins.findFirst({
        where: eq(models.admins.roleId, superAdminRole!?.id),
        columns: { id: true },
      });

      if (!superAdmin) {
        throw new Error('No Super Admin found in PostgreSQL database');
      }

      this.createdAdminId = superAdmin.id;
      console.log(`🔧 Using Super Admin ID: ${this.createdAdminId} for foreign key references`);

      return this.createdAdminId;
    } catch (error) {
      console.error('❌ Failed to get available admin:', error);
      throw error;
    }
  }

  // Disconnect from databases
  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  // Map MongoDB payment status to PostgreSQL payment status
  private mapPaymentStatus(mongoStatus: string): 'pending' | 'completed' | 'failed' {
    switch (mongoStatus?.toUpperCase()) {
      case 'PAID':
        return 'completed';
      case 'FAILED':
        return 'failed';
      case 'PENDING':
      case 'INITIATE':
      default:
        return 'pending';
    }
  }

  // Map MongoDB application status to PostgreSQL application status
  private mapApplicationStatus(
    mongoStatus: string
  ):
    | 'draft'
    | 'submitted'
    | 'documents_upload_pending'
    | 'documents_uploaded'
    | 'documents_verified'
    | 'reviewed'
    | 'processing'
    | 'refund_completed' {
    switch (mongoStatus?.toUpperCase()) {
      case 'SUBMITTED':
        return 'submitted';
      case 'DOCUMENTS_UPLOADED':
        return 'documents_uploaded';
      case 'DOCUMENTS_VERIFIED':
        return 'documents_verified';
      case 'PROCESSING':
        return 'processing';
      case 'REVIEWED':
        return 'reviewed';
      case 'COMPLETED':
      case 'REFUND_COMPLETED':
      case 'APPROVED':
        return 'refund_completed';
      case 'DELETED':
        return 'draft'; // Map deleted to draft since rejected doesn't exist in enum
      default:
        return 'draft';
    }
  }

  private mapApplicationReviewStatus(mongoStatus: string): 'rejected' | 'pending' | 'approved' {
    switch (mongoStatus?.toUpperCase()) {
      case 'DELETED':
        return 'pending';
      case 'REJECTED':
        return 'rejected';
      case 'PENDING':
        return 'pending';
      case 'APPROVED':
        return 'approved';

      default:
        return 'pending';
    }
  }
  // Main migration method
  async migrate(): Promise<void> {
    console.log('🚀 Starting Application Migration from MongoDB to PostgreSQL...');
    console.log(`📊 Configuration: MongoDB DB: ${this.config.mongoDbName}`);

    try {
      await this.migrateApplications();
      await this.printSummary();
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Migrate applications from MongoDB to PostgreSQL
  private async migrateApplications(): Promise<void> {
    console.log('\n📋 Step 1: Fetching ApplicationQuestionnaire documents from MongoDB...');

    try {
      // Fetch all ApplicationQuestionnaire documents without population to avoid schema issues
      const applicationQuestionnaires = (await ApplicationQuestionnaireModel.find({})
        .lean()
        .exec()) as unknown as MongoApplicationQuestionnaire[];

      this.stats.totalApplicationQuestionnaires = applicationQuestionnaires.length;
      console.log(
        `📊 Found ${this.stats.totalApplicationQuestionnaires} ApplicationQuestionnaire documents`
      );

      if (this.stats.totalApplicationQuestionnaires === 0) {
        console.log('ℹ️ No ApplicationQuestionnaire documents found to migrate');
        return;
      }

      // Process each ApplicationQuestionnaire in batches
      const batchSize = 10;
      for (let i = 0; i < applicationQuestionnaires.length; i += batchSize) {
        const batch = applicationQuestionnaires.slice(i, i + batchSize);
        console.log(
          `🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(applicationQuestionnaires.length / batchSize)}`
        );

        for (const appQuestionnaire of batch) {
          try {
            await this.processApplicationQuestionnaire(appQuestionnaire);
          } catch (error) {
            console.error(
              `❌ Failed to process ApplicationQuestionnaire ${appQuestionnaire._id}:`,
              error
            );
            this.stats.addError(appQuestionnaire._id, error as Error);
          }
        }

        // Small delay between batches to prevent overwhelming the database
        if (i + batchSize < applicationQuestionnaires.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('❌ Error during ApplicationQuestionnaire migration:', error);
      throw error;
    }
  }

  // Process individual ApplicationQuestionnaire document
  private async processApplicationQuestionnaire(
    appQuestionnaire: MongoApplicationQuestionnaire
  ): Promise<void> {
    // Track status
    if (appQuestionnaire.status === 'ACTIVE') {
      this.stats.addActive();
    } else if (appQuestionnaire.status === 'DELETED') {
      this.stats.addDeleted();
    }

    // Fetch the referenced user and application data separately
    const mongoUser = await UserModel.findById(appQuestionnaire.userId).lean().exec();
    const mongoApplication = await ApplicationModel.findById(appQuestionnaire.applicationId)
      .lean()
      .exec();

    if (!mongoUser || !(mongoUser as unknown as MongoUser).pgUserId) {
      console.warn(
        `⚠️ ApplicationQuestionnaire ${appQuestionnaire._id}: User not found or not migrated yet`
      );
      this.stats.addOrphaned();
      return;
    }

    if (!mongoApplication) {
      console.warn(`⚠️ ApplicationQuestionnaire ${appQuestionnaire._id}: Application not found`);
      this.stats.addOrphaned();
      return;
    }

    // // Check if application already exists in PostgreSQL
    // if (appQuestionnaire.pgApplicationId) {
    //   console.log(`ℹ️ Application ${mongoApplication._id} already migrated to PostgreSQL`);
    //   this.stats.addDuplicate();

    //   // Still process questionnaire responses if not already created
    //   //   await this.createQuestionnaireResponsesAndAnswers(
    //   //     appQuestionnaire,
    //   //     appQuestionnaire.pgApplicationId
    //   //   );
    //   //   this.stats.addSuccess();
    //   return;
    // }

    // Create PostgreSQL application
    const pgApplicationId = await this.createPostgreSQLApplication(
      mongoApplication as unknown as MongoApplication,
      (mongoUser as unknown as MongoUser).pgUserId
    );

    if (pgApplicationId) {
      // Update MongoDB ApplicationQuestionnaire with PostgreSQL ID
      await ApplicationQuestionnaireModel.updateOne(
        { _id: appQuestionnaire._id },
        { $set: { pgApplicationId } }
      );

      // Create questionnaire responses and answers
      await this.createQuestionnaireResponsesAndAnswers(appQuestionnaire, pgApplicationId);

      console.log(
        `✅ Successfully migrated Application ${mongoApplication._id} -> ${pgApplicationId}`
      );
      this.stats.addSuccess();
    }

    if (
      mongoApplication.statusHistory &&
      mongoApplication.statusHistory.length > 0 &&
      pgApplicationId
    ) {
      console.log(
        `ℹ️ Application ${mongoApplication._id} has status history with ${mongoApplication.statusHistory.length} entries. Consider migrating this data if needed.`
      );
      await this.addApplicationStatuses(mongoApplication.statusHistory, pgApplicationId);
    }
    if (
      mongoApplication.documents &&
      mongoApplication.documents.length > 0 &&
      pgApplicationId &&
      mongoUser.pgUserId
    ) {
      await this.addApplicationDocuments(
        mongoApplication.documents,
        pgApplicationId,
        mongoUser.pgUserId
      );
    }
    const appReview = await ApplicationReviewModel.findOne({
      applicationId: mongoApplication._id,
    })
      .lean()
      .exec();

    if (appReview) {
      // Process the application review
      console.log(`ℹ️ Application ${mongoApplication._id} has an associated review.`);
      await this.addApplicationReview(appReview, pgApplicationId!);
    }
  }

  // Create PostgreSQL application record
  private async createPostgreSQLApplication(
    mongoApp: MongoApplication,
    pgUserId: string
  ): Promise<string | null> {
    try {
      // Generate application number if not present
      const applicationNo =
        mongoApp.applicationId || `APP-${mongoApp.applicationIdNo || Date.now()}`;
      const hashedApplicationNo = hashWithHMAC(applicationNo);

      // Calculate final amount if not present
      const finalAmount =
        mongoApp.totalCommissionAmount ||
        (mongoApp.commissionAmount || 0) +
          (mongoApp.vatAmount || 0) -
          (mongoApp.discountAmount || 0);

      const [pgApplication] = await db
        .insert(applications)
        .values({
          applicationNo: applicationNo,
          userId: pgUserId,
          year: mongoApp.year || new Date().getFullYear(),
          refundAmount: mongoApp.refundAmount?.toString() || '0',
          commissionPercentage: mongoApp.commissionPercentage?.toString() || '0',
          commissionAmount: mongoApp.commissionAmount?.toString() || '0',
          vatPercentage: mongoApp.vatPercentage?.toString() || '0',
          vatAmount: mongoApp.vatAmount?.toString() || '0',
          discountAmount: mongoApp.discountAmount?.toString() || '0',
          totalCommissionAmount: mongoApp.totalCommissionAmount?.toString() || '0',
          finalAmount: finalAmount.toString(),
          isQuestionnaireSubmitted: true,
          paymentStatus: this.mapPaymentStatus(mongoApp.paymentStatus),
          invoiceId: mongoApp.invoiceId || null,
          invoiceNo: mongoApp.invoiceIdNo || null,
          status: this.mapApplicationStatus(mongoApp.status),
          isAmendment: false,
          createdAt: mongoApp.create_date || new Date(),
          updatedAt: mongoApp.update_date || new Date(),
          hashedApplicationNo: hashedApplicationNo,
        })
        .returning({ id: applications.id });

      return pgApplication.id;
    } catch (error) {
      console.error('❌ Error creating PostgreSQL application:', error);
      throw error;
    }
  }

  // Create PostgreSQL application record
  private async addApplicationStatuses(
    appStatuses: any[],
    pgApplicationId: string
  ): Promise<string | null> {
    try {
      for (const status of appStatuses) {
        await db.insert(applicationStatusHistories).values({
          applicationId: pgApplicationId,
          status: this.mapApplicationStatus(status.status),
          createdAt: status.createdAt || new Date(),
        });
      }
      return pgApplicationId;
    } catch (error) {
      console.error('❌ Error adding application statuses:', error);
      throw error;
    }
  }

  private async addApplicationDocuments(
    appDocuments: any[],
    pgApplicationId: string,
    pgUserId: string
  ): Promise<string | null> {
    try {
      for (const doc of appDocuments) {
        const docCategory = await DocumentCategoryModel.findById(doc.categoryId).lean().exec();
        if (docCategory && docCategory.pgDocumentCategoryId) {
          const [appDocumentCategory] = await db
            .insert(models.applicationDocumentCategories)
            .values({
              status: 'accepted',
              adminId: this.createdAdminId!,
              applicationId: pgApplicationId,
              documentCategoryId: docCategory.pgDocumentCategoryId,
              isRequired: true,
              isAdditionalDocument: true,
              createdAt: doc.uploadDate || new Date(),
              updatedAt: doc.uploadDate || new Date(),
            })
            .returning({ id: models.applicationDocumentCategories.id });
          // Insert file record
          const fileId = await this.insertFile(doc.originalFileName, doc.file, pgUserId);
          // Link file to application document category file only if file was created successfully
          if (fileId) {
            await db.insert(models.applicationDocumentCategoryFiles).values({
              applicationDocumentCategoryId: appDocumentCategory.id,
              fileId: fileId,
              createdAt: new Date(),
            });
          }
        }
      }
      return pgApplicationId;
    } catch (error) {
      console.error('❌ Error adding application documents:', error);
      throw error;
    }
  }

  private async addApplicationReview(
    appReview: any,
    pgApplicationId: string
  ): Promise<string | null> {
    try {
      if (appReview) {
        await db.insert(models.applicationReviews).values({
          applicationId: pgApplicationId,
          rating: appReview.rating,
          review: appReview.review,
          status: this.mapApplicationReviewStatus(appReview.status),
          createdAt: appReview.create_date || new Date(),
          updatedAt: appReview.update_date || new Date(),
        });
      }
      return pgApplicationId;
    } catch (error) {
      console.error('❌ Error adding application review:', error);
      throw error;
    }
  }

  // Create questionnaire responses and question answers
  private async createQuestionnaireResponsesAndAnswers(
    appQuestionnaire: MongoApplicationQuestionnaire,
    pgApplicationId: string
  ): Promise<void> {
    try {
      // Check if questionnaire response already exists
      const existingResponse = await db.query.questionnaireResponses.findFirst({
        where: eq(models.questionnaireResponses.applicationId, pgApplicationId),
      });

      if (existingResponse) {
        console.log(`ℹ️ QuestionnaireResponse already exists for application ${pgApplicationId}`);
        return;
      }

      // Create questionnaire response
      const [questionnaireResponse] = await db
        .insert(questionnaireResponses)
        .values({
          questionnaireId: appQuestionnaire.pgQuestionnaireId,
          applicationId: pgApplicationId,
          status: 'submitted',
          completionPercentage: 100,
          submittedAt: appQuestionnaire.create_date || new Date(),
          createdAt: appQuestionnaire.create_date || new Date(),
          updatedAt: appQuestionnaire.update_date || new Date(),
        })
        .returning({ id: questionnaireResponses.id });

      this.stats.addQuestionnaireResponse();

      // Create individual question responses
      for (const categoryData of appQuestionnaire.allQuestionAnswers || []) {
        for (const questionData of categoryData.questions || []) {
          if (questionData.pgQuestionId) {
            try {
              await db.insert(questionResponses).values({
                questionnaireResponseId: questionnaireResponse.id,
                questionId: questionData.pgQuestionId,
                value: this.serializeQuestionAnswer(questionData.answer, questionData.answerType),
                answeredAt: appQuestionnaire.create_date || new Date(),
                createdAt: appQuestionnaire.create_date || new Date(),
                updatedAt: appQuestionnaire.update_date || new Date(),
              });

              this.stats.addQuestionResponse();
            } catch (error) {
              console.warn(
                `⚠️ Failed to create question response for question ${questionData.pgQuestionId}:`,
                error
              );
            }
          }
        }
      }

      console.log(`✅ Created questionnaire responses for application ${pgApplicationId}`);
    } catch (error) {
      console.error('❌ Error creating questionnaire responses:', error);
      throw error;
    }
  }

  // Serialize question answer based on type
  private serializeQuestionAnswer(answer: unknown, answerType: string): string {
    if (answer === null || answer === undefined) {
      return '';
    }

    switch (answerType) {
      case 'String':
        return String(answer);
      case 'Number':
        return String(answer);
      case 'Date':
        if (answer instanceof Date) {
          return answer.toISOString();
        }
        return String(answer);
      case 'Boolean':
        return String(Boolean(answer));
      default:
        return JSON.stringify(answer);
    }
  }

  // Print migration summary
  private async printSummary(): Promise<void> {
    const duration = this.stats.getDuration();
    const successRate = this.stats.getSuccessRate();

    console.log('\n' + '='.repeat(80));
    console.log('📊 APPLICATION MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📋 Total ApplicationQuestionnaires: ${this.stats.totalApplicationQuestionnaires}`);
    console.log(`✅ Successful Migrations: ${this.stats.successfulApplicationMigrations}`);
    console.log(`❌ Failed Migrations: ${this.stats.failedApplicationMigrations}`);
    console.log(`⏭️  Skipped Records: ${this.stats.skippedApplications}`);
    console.log(`🔄 Duplicate Applications: ${this.stats.duplicateApplications}`);
    console.log(
      `🔗 Orphaned ApplicationQuestionnaires: ${this.stats.orphanedApplicationQuestionnaires}`
    );
    console.log(`📊 Success Rate: ${successRate}%`);
    console.log(`\n📈 Records Created:`);
    console.log(`   • QuestionnaireResponses: ${this.stats.questionnaireResponsesCreated}`);
    console.log(`   • QuestionResponses: ${this.stats.questionResponsesCreated}`);
    console.log(`\n📊 Record Status Distribution:`);
    console.log(
      `   • Active ApplicationQuestionnaires: ${this.stats.activeApplicationQuestionnaires}`
    );
    console.log(
      `   • Deleted ApplicationQuestionnaires: ${this.stats.deletedApplicationQuestionnaires}`
    );

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.stats.errors.length}):`);
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(
          `   ${index + 1}. ApplicationQuestionnaire ${error.applicationId}: ${error.error}`
        );
      });
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    console.log('='.repeat(80));
  }

  // Insert file into PostgreSQL based on chat file/photo/video fields
  private async insertFile(
    fileName: string,
    fileKey: string,
    pgUserId: string
  ): Promise<string | null> {
    try {
      const [fileRecord] = await db
        .insert(files)
        .values({
          key: fileKey,
          fileName: fileName || 'unknown',
          mimeType: this.getMimeTypeFromFileName(fileName),
          fileSize: '0', // Size not available from MongoDB schema
          fileType: 'application_document',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          uploaderType: 'user',
          uploadedBy: pgUserId,
        })
        .returning({ id: files.id });

      return fileRecord.id;
    } catch (error) {
      console.error('Failed to insert file:', error);
      return null;
    }
  }

  // Helper method to determine MIME type from file name
  private getMimeTypeFromFileName(fileName: string): string {
    if (!fileName) return 'application/octet-stream';

    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

// Export migration function
export async function migrateApplications(): Promise<void> {
  const config = new ApplicationMigrationConfig();
  const migrator = new ApplicationMigrator(config);

  try {
    await migrator.connect();
    await migrator.migrate();
  } finally {
    await migrator.disconnect();
  }
}

// Main execution function
async function main(): Promise<void> {
  try {
    await migrateApplications();
    console.log('🎉 Application migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Application migration failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}
