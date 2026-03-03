import { eq } from 'drizzle-orm';
import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, models, pool } from '@/database';
import { questionCategories, questionnaires, questions } from '@/database/models';

import defaults from '../default';
import { ApplicationQuestionnaireModel } from '../schema/applicationQuestionnaire';

// Type definitions for MongoDB ApplicationQuestionnaire document
interface MongoApplicationQuestionnaire extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  allQuestionAnswers: Array<{
    category: string; // This should be mapped to document category
    questions: Array<{
      question: string;
      answer: unknown;
      answerType: 'String' | 'Number' | 'Date' | 'Boolean';
    }>;
  }>;
  status: 'ACTIVE' | 'DELETED';
  create_date: Date;
  update_date: Date;
}

interface ApplicationYear {
  applicationId: mongoose.Types.ObjectId;
  year: number;
}

interface MigrationError {
  applicationQuestionnaireId: string;
  error: string;
  mongoData: Partial<MongoApplicationQuestionnaire>;
  timestamp: Date;
}

// Configuration
class QuestionnaireMigrationConfig {
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
class QuestionnaireMigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public activeRecords: number = 0;
  public deletedRecords: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();
  public processedYears: Set<number> = new Set();
  public processedCategories: Set<string> = new Set();
  public processedQuestions: number = 0;
  public questionnairesCreated: number = 0;
  public categoriesCreated: number = 0;

  addError(
    applicationQuestionnaireId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoApplicationQuestionnaire> = {}
  ): void {
    this.errors.push({
      applicationQuestionnaireId: applicationQuestionnaireId.toString(),
      error: error instanceof Error ? error.message : String(error),
      mongoData,
      timestamp: new Date(),
    });
    this.failedMigrations++;
  }

  addSuccess(): void {
    this.successfulMigrations++;
  }

  addSkipped(): void {
    this.skippedRecords++;
  }

  addActive(): void {
    this.activeRecords++;
  }

  addDeleted(): void {
    this.deletedRecords++;
  }

  addYear(year: number): void {
    this.processedYears.add(year);
  }

  addCategory(categoryName: string): void {
    this.processedCategories.add(categoryName);
  }

  addQuestion(): void {
    this.processedQuestions++;
  }

  addQuestionnaire(): void {
    this.questionnairesCreated++;
  }

  addCategoryCreated(): void {
    this.categoriesCreated++;
  }

  getSuccessRate(): string {
    if (this.totalRecords === 0) return '0.00';
    return ((this.successfulMigrations / this.totalRecords) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Questionnaire Migration Class
class QuestionnaireMigrator {
  private config: QuestionnaireMigrationConfig;
  private stats: QuestionnaireMigrationStats;
  private createdAdminId: string | null = null; // Will be set to first available admin ID

  constructor(config: QuestionnaireMigrationConfig) {
    this.config = config;
    this.stats = new QuestionnaireMigrationStats();
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
        throw new Error('Super admin not found in PostgreSQL database');
      }

      this.createdAdminId = superAdmin.id;
      console.log('✅ Found super admin ID:', this.createdAdminId);
      return this.createdAdminId;
    } catch (error) {
      console.error('❌ Failed to get super admin ID:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('📡 Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Get unique years from applications that exist in ApplicationQuestionnaire
  private async getDistinctYearsFromApplications(): Promise<ApplicationYear[]> {
    try {
      console.log('🔍 Fetching distinct years from applications in ApplicationQuestionnaire...');

      // Get application IDs from ApplicationQuestionnaire and lookup their years
      const applicationYears = await ApplicationQuestionnaireModel.aggregate([
        {
          // Get unique application IDs from ApplicationQuestionnaire
          $group: {
            _id: '$applicationId',
            applicationId: { $first: '$applicationId' },
          },
        },
        {
          // Lookup year from ApplicationModel
          $lookup: {
            from: 'applicationmodels', // MongoDB collection name (usually lowercase + s)
            localField: 'applicationId',
            foreignField: '_id',
            as: 'application',
          },
        },
        {
          // Unwind the application array
          $unwind: {
            path: '$application',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          // Project only what we need
          $project: {
            applicationId: '$applicationId',
            year: '$application.year',
          },
        },
        {
          // Filter out null years
          $match: {
            year: { $ne: null },
          },
        },
      ]);

      console.log(
        `📊 Found ${applicationYears.length} applications with years in ApplicationQuestionnaire`
      );
      return applicationYears.map((item) => ({
        applicationId: item.applicationId,
        year: item.year,
      }));
    } catch (error) {
      console.error('❌ Failed to get distinct years from applications:', error);
      throw error;
    }
  }

  // Create questionnaire for each unique year
  private async createQuestionnairesForYears(
    applicationYears: ApplicationYear[]
  ): Promise<Map<number, string>> {
    const yearToQuestionnaireId = new Map<number, string>();
    const processedYears = new Set<number>();

    try {
      console.log('📝 Creating questionnaires for each year...');

      for (const appYear of applicationYears) {
        if (processedYears.has(appYear.year)) {
          continue; // Skip if already processed this year
        }

        let questionnaireId: string;

        // Create new questionnaire
        if (!this.createdAdminId) {
          throw new Error(
            'Admin ID not found. Cannot create questionnaires without valid admin reference.'
          );
        }

        const [newQuestionnaire] = await db
          .insert(questionnaires)
          .values({
            taxYear: appYear.year,
            title: `Tax Questionnaire ${appYear.year}`,
            description: `Tax questionnaire for the year ${appYear.year}`,
            version: 0,
            status: 'archived',
            createdBy: this.createdAdminId,
            publishedAt: new Date(),
            publishedBy: this.createdAdminId,
          })
          .returning({ id: questionnaires.id });

        questionnaireId = newQuestionnaire.id;
        this.stats.addQuestionnaire();
        console.log(`✅ Created questionnaire for year ${appYear.year}: ${questionnaireId}`);

        yearToQuestionnaireId.set(appYear.year, questionnaireId);
        processedYears.add(appYear.year);
        this.stats.addYear(appYear.year);
      }

      return yearToQuestionnaireId;
    } catch (error) {
      console.error('❌ Failed to create questionnaires:', error);
      throw error;
    }
  }

  // Get or create question category for questionnaire
  private async getOrCreateQuestionCategory(
    questionnaireId: string,
    categoryName: string
  ): Promise<string> {
    try {
      // Check if category already exists
      const existingCategory = await db.query.questionCategories.findFirst({
        where: (questionCategories, { and, eq }) =>
          and(
            eq(questionCategories.questionnaireId, questionnaireId),
            eq(questionCategories.name, categoryName)
          ),
      });

      if (existingCategory) {
        return existingCategory.id;
      }

      // Create new category
      const [newCategory] = await db
        .insert(questionCategories)
        .values({
          questionnaireId,
          name: categoryName,
          description: `Category for ${categoryName} questions - migrated from MongoDB`,
          sortOrder: 0,
        })
        .returning({ id: questionCategories.id });

      this.stats.addCategoryCreated();
      this.stats.addCategory(categoryName);
      console.log(`✅ Created question category "${categoryName}": ${newCategory.id}`);

      return newCategory.id;
    } catch (error) {
      console.error(`❌ Failed to create question category "${categoryName}":`, error);
      throw error;
    }
  }

  // Create questions for a category and return their IDs
  private async createQuestionsForCategory(
    questionnaireId: string,
    categoryId: string,
    mongoQuestions: Array<{
      question: string;
      answer: unknown;
      answerType: 'String' | 'Number' | 'Date' | 'Boolean';
    }>
  ): Promise<string[]> {
    const createdQuestionIds: string[] = [];

    try {
      for (let i = 0; i < mongoQuestions.length; i++) {
        const mongoQuestion = mongoQuestions[i];

        // Skip if question text is empty
        if (!mongoQuestion.question || mongoQuestion.question.trim() === '') {
          console.warn(`⚠️  Skipping empty question in category ${categoryId}`);
          createdQuestionIds.push(''); // Add empty string to maintain array alignment
          continue;
        }

        // Check if question already exists
        const existingQuestion = await db.query.questions.findFirst({
          where: (questions, { and, eq }) =>
            and(
              eq(questions.questionnaireId, questionnaireId),
              eq(questions.categoryId, categoryId),
              eq(questions.questionText, mongoQuestion.question)
            ),
        });

        if (existingQuestion) {
          console.log(
            `📋 Question already exists: "${mongoQuestion.question.substring(0, 50)}..."`
          );
          createdQuestionIds.push(existingQuestion.id);
          continue;
        }

        // Map question type based on answerType
        let questionType: 'text' | 'dropdown' | 'radio' | 'date' = 'text';

        switch (mongoQuestion.answerType) {
          case 'Date':
            questionType = 'date';
            break;
          case 'Boolean':
            questionType = 'radio'; // Use radio for boolean (Yes/No)
            break;
          case 'Number':
          case 'String':
          default:
            questionType = 'text';
            break;
        }

        // Create question
        const [newQuestion] = await db
          .insert(questions)
          .values({
            questionnaireId,
            categoryId,
            questionText: mongoQuestion.question,
            questionType,
            isRequired: false, // Default to not required
            sortOrder: i,
            options:
              questionType === 'radio' && mongoQuestion.answerType === 'Boolean'
                ? JSON.stringify([
                    { value: 'yes', label: 'Yes', order: 0 },
                    { value: 'no', label: 'No', order: 1 },
                  ])
                : null,
          })
          .returning({ id: questions.id });

        this.stats.addQuestion();
        createdQuestionIds.push(newQuestion.id);
        console.log(
          `✅ Created question: "${mongoQuestion.question.substring(0, 50)}..." (${newQuestion.id})`
        );
      }

      return createdQuestionIds;
    } catch (error) {
      console.error('❌ Failed to create questions for category:', error);
      throw error;
    }
  }

  // Update MongoDB ApplicationQuestionnaire with PostgreSQL IDs
  private async updateMongoWithPostgreSQLIds(
    mongoDocId: mongoose.Types.ObjectId,
    questionnaireId: string,
    categoryMappings: Map<string, string>,
    questionMappings: Map<string, string[]>
  ): Promise<void> {
    try {
      // Update the main document with pgQuestionnaireId
      await ApplicationQuestionnaireModel.updateOne(
        { _id: mongoDocId },
        {
          $set: {
            pgQuestionnaireId: questionnaireId,
          },
        }
      );

      // Get the document to update allQuestionAnswers
      const mongoDoc = await ApplicationQuestionnaireModel.findById(mongoDocId);
      if (!mongoDoc) return;

      // Update allQuestionAnswers with PostgreSQL IDs
      const updatedAllQuestionAnswers = mongoDoc.allQuestionAnswers.map((categoryData) => {
        const pgCategoryId = categoryMappings.get(categoryData.category || '');
        const questionIds = questionMappings.get(categoryData.category || '') || [];

        const updatedQuestions = categoryData.questions.map((question, index: number) => ({
          question: question.question,
          answer: question.answer,
          answerType: question.answerType,
          pgQuestionId: questionIds[index] || null,
        }));

        return {
          category: categoryData.category,
          pgQuestionnaireCategoryId: pgCategoryId || null,
          questions: updatedQuestions,
        };
      });

      // Update the document with the new allQuestionAnswers
      await ApplicationQuestionnaireModel.updateOne(
        { _id: mongoDocId },
        {
          $set: {
            allQuestionAnswers: updatedAllQuestionAnswers,
          },
        }
      );

      console.log(`✅ Updated MongoDB document ${mongoDocId} with PostgreSQL IDs`);
    } catch (error) {
      console.error(`❌ Failed to update MongoDB document ${mongoDocId}:`, error);
      throw error;
    }
  }

  // Process single ApplicationQuestionnaire document
  private async processApplicationQuestionnaire(
    mongoDoc: MongoApplicationQuestionnaire,
    yearToQuestionnaireMap: Map<number, string>,
    applicationYearsMap: Map<string, number>
  ): Promise<void> {
    try {
      // Get the application year
      const applicationId = mongoDoc.applicationId.toString();
      const applicationYear = applicationYearsMap.get(applicationId);

      if (!applicationYear) {
        console.warn(
          `⚠️  Application year not found for application ${applicationId}, skipping...`
        );
        this.stats.addSkipped();
        return;
      }

      // Get the questionnaire for this year
      const questionnaireId = yearToQuestionnaireMap.get(applicationYear);
      if (!questionnaireId) {
        console.warn(`⚠️  Questionnaire not found for year ${applicationYear}, skipping...`);
        this.stats.addSkipped();
        return;
      }

      // Update stats based on status
      if (mongoDoc.status === 'DELETED') {
        this.stats.addDeleted();
      } else {
        this.stats.addActive();
      }

      // Maps to store PostgreSQL IDs for updating MongoDB
      const categoryMappings = new Map<string, string>();
      const questionMappings = new Map<string, string[]>();

      // Process each category in allQuestionAnswers
      for (const categoryData of mongoDoc.allQuestionAnswers) {
        if (!categoryData.category || categoryData.category.trim() === '') {
          console.warn('⚠️  Skipping category with empty name');
          continue;
        }

        // Get or create question category
        const questionCategoryId = await this.getOrCreateQuestionCategory(
          questionnaireId,
          categoryData.category
        );

        // Store category mapping
        categoryMappings.set(categoryData.category, questionCategoryId);

        // Create questions for this category and collect their IDs
        const questionIds: string[] = [];
        if (categoryData.questions && categoryData.questions.length > 0) {
          const createdQuestionIds = await this.createQuestionsForCategory(
            questionnaireId,
            questionCategoryId,
            categoryData.questions
          );
          questionIds.push(...createdQuestionIds);
        }

        // Store question mappings
        questionMappings.set(categoryData.category, questionIds);
      }

      // Update MongoDB with PostgreSQL IDs
      await this.updateMongoWithPostgreSQLIds(
        mongoDoc._id,
        questionnaireId,
        categoryMappings,
        questionMappings
      );

      this.stats.addSuccess();
    } catch (error) {
      console.error(`❌ Failed to process ApplicationQuestionnaire ${mongoDoc._id}:`, error);
      this.stats.addError(mongoDoc._id, error as Error, {
        userId: mongoDoc.userId,
        applicationId: mongoDoc.applicationId,
        status: mongoDoc.status,
      });
    }
  }

  // Main migration function
  async migrateQuestionnaires(): Promise<void> {
    try {
      // Step 1: Get single document to understand structure (for validation)
      console.log('🔍 Getting sample ApplicationQuestionnaire document...');
      const sampleDoc = await ApplicationQuestionnaireModel.findOne({});

      if (!sampleDoc) {
        console.log('⚠️  No ApplicationQuestionnaire documents found. Migration completed.');
        return;
      }

      console.log('✅ Sample document found, proceeding with migration...');
      console.log(`📋 Sample document has ${sampleDoc.allQuestionAnswers?.length || 0} categories`);

      // Step 2: Get all application years
      const applicationYears = await this.getDistinctYearsFromApplications();
      const applicationYearsMap = new Map<string, number>();

      for (const appYear of applicationYears) {
        applicationYearsMap.set(appYear.applicationId.toString(), appYear.year);
      }

      // Step 3: Create questionnaires for each year
      const yearToQuestionnaireMap = await this.createQuestionnairesForYears(applicationYears);

      // Step 4: Get total count
      this.stats.totalRecords = await ApplicationQuestionnaireModel.countDocuments();
      console.log(
        `🚀 Starting migration of ${this.stats.totalRecords} ApplicationQuestionnaire records`
      );

      // Step 5: Process all ApplicationQuestionnaire documents
      console.log('🔄 Processing ApplicationQuestionnaire documents...');

      const cursor = ApplicationQuestionnaireModel.find({}).cursor();
      let processedCount = 0;

      for (let mongoDoc = await cursor.next(); mongoDoc != null; mongoDoc = await cursor.next()) {
        processedCount++;

        try {
          // Skip documents without essential data
          if (!mongoDoc.allQuestionAnswers || mongoDoc.allQuestionAnswers.length === 0) {
            console.warn(`⚠️  Skipping document ${mongoDoc._id}: No question answers`);
            this.stats.addSkipped();
            continue;
          }

          await this.processApplicationQuestionnaire(
            mongoDoc as unknown as MongoApplicationQuestionnaire,
            yearToQuestionnaireMap,
            applicationYearsMap
          );

          // Log progress every 10 records
          if (processedCount % 10 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} documents (${this.stats.successfulMigrations} successful)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to process document ${mongoDoc._id}:`, (error as Error).message);
          this.stats.addError(mongoDoc._id, error as Error, {
            userId: mongoDoc.userId,
            applicationId: mongoDoc.applicationId,
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Questionnaire migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 QUESTIONNAIRE MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`🟢 Active Records: ${this.stats.activeRecords}`);
    console.log(`🔴 Deleted Records: ${this.stats.deletedRecords}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);
    console.log('');
    console.log('📊 CREATED ENTITIES:');
    console.log(`📝 Questionnaires: ${this.stats.questionnairesCreated}`);
    console.log(`📂 Categories: ${this.stats.categoriesCreated}`);
    console.log(`❓ Questions: ${this.stats.processedQuestions}`);
    console.log(`📅 Years Processed: ${Array.from(this.stats.processedYears).sort().join(', ')}`);
    console.log(
      `🏷️  Category Names: ${Array.from(this.stats.processedCategories).slice(0, 10).join(', ')}${this.stats.processedCategories.size > 10 ? '...' : ''}`
    );

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. Document ${error.applicationQuestionnaireId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify questionnaires are created for all required years');
    console.log('2. Check question categories and their mapping to document categories');
    console.log('3. Validate question types and options are correctly set');
    console.log('4. Test questionnaire functionality in the application');
    console.log('5. Consider adding validation rules and help text for questions');
    console.log('6. Update sort orders for categories and questions if needed');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateQuestionnaires();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runQuestionnaireMigration(): Promise<boolean> {
  try {
    const config = new QuestionnaireMigrationConfig();

    console.log('🎯 Starting Questionnaire Migration from MongoDB to PostgreSQL...');
    console.log('📝 Migrating questionnaires, categories, and questions...');
    console.log('📋 Configuration Source:');

    // Show configuration source
    if (process.env.MONGO_URI) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI)');
    } else if (process.env.MONGO_URI_DEV) {
      console.log('   MongoDB URI: Environment variable (MONGO_URI_DEV)');
    } else {
      console.log('   MongoDB URI: Default configuration (default.js)');
    }

    console.log(`📡 MongoDB URI: ${config.mongoUri.replace(/\/\/.*@/, '//***@')}`);
    console.log(`🗄️  MongoDB Database: ${config.mongoDbName}`);
    console.log(`🐘 PostgreSQL: Connected\n`);

    const migrator = new QuestionnaireMigrator(config);
    await migrator.run();

    console.log('🎉 Questionnaire migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Questionnaire migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { QuestionnaireMigrator, QuestionnaireMigrationConfig, runQuestionnaireMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runQuestionnaireMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
