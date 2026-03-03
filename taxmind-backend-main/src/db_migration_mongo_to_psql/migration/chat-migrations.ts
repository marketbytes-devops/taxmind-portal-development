import { eq } from 'drizzle-orm';
import mongoose, { Document } from 'mongoose';
import { PoolClient } from 'pg';

import { db, models, pool } from '@/database';
import { chats, files } from '@/database/models';

import defaults from '../default';
import { ChatModel } from '../schema/chat';
import { UserModel } from '../schema/user';

// Type definitions for MongoDB Chat document
interface MongoChat extends Document {
  _id: mongoose.Types.ObjectId;
  senderAdminId?: mongoose.Types.ObjectId;
  senderUserId?: mongoose.Types.ObjectId;
  receiverAdminId?: mongoose.Types.ObjectId;
  receiverUserId?: mongoose.Types.ObjectId;
  messageType: string; // TEXT, PHOTO, VIDEO, FILE
  text?: string; // Encrypted field
  photo?: string; // Encrypted field
  video?: string; // Encrypted field
  file?: string; // Encrypted field
  originalFileName?: string; // Encrypted field
  status: string; // UNREAD, READ, DELETED
  create_date: Date;
  update_date: Date;
  pgChatId?: string; // Will be added after migration
}

interface MigrationError {
  chatId: string;
  error: string;
  mongoData: Partial<MongoChat>;
  timestamp: Date;
}

// Configuration
class ChatMigrationConfig {
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
class ChatMigrationStats {
  public totalRecords: number = 0;
  public successfulMigrations: number = 0;
  public failedMigrations: number = 0;
  public skippedRecords: number = 0;
  public filesProcessed: number = 0;
  public userMessages: number = 0;
  public adminMessages: number = 0;
  public errors: MigrationError[] = [];
  public startTime: Date = new Date();

  addError(
    chatId: mongoose.Types.ObjectId | string,
    error: Error | string,
    mongoData: Partial<MongoChat> = {}
  ): void {
    this.errors.push({
      chatId: chatId.toString(),
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

  addFile(): void {
    this.filesProcessed++;
  }

  addUserMessage(): void {
    this.userMessages++;
  }

  addAdminMessage(): void {
    this.adminMessages++;
  }

  getSuccessRate(): string {
    if (this.totalRecords === 0) return '0.00';
    return ((this.successfulMigrations / this.totalRecords) * 100).toFixed(2);
  }

  getDuration(): number {
    return Math.round((new Date().getTime() - this.startTime.getTime()) / 1000);
  }
}

// Chat Migration Class
class ChatMigrator {
  private config: ChatMigrationConfig;
  private stats: ChatMigrationStats;
  private userIdMap: Map<string, string> = new Map(); // MongoDB ObjectId -> PostgreSQL UUID
  private superAdminId: string | null = null;

  constructor(config: ChatMigrationConfig) {
    this.config = config;
    this.stats = new ChatMigrationStats();
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
    } catch (error) {
      console.error('❌ Failed to establish database connections:', error);
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

  // Load user ID mappings from MongoDB users that have pgUserId
  private async loadUserIdMappings(): Promise<void> {
    try {
      console.log('🔍 Loading user ID mappings...');

      const mongoUsers = await UserModel.find({ pgUserId: { $exists: true, $ne: null } });

      for (const user of mongoUsers) {
        this.userIdMap.set(user._id.toString(), user.pgUserId as string);
      }

      console.log(`✅ Loaded ${this.userIdMap.size} user ID mappings`);
    } catch (error) {
      console.error('❌ Failed to load user ID mappings:', error);
      throw error;
    }
  }

  // Get or create super admin for admin messages
  private async getSuperAdminId(): Promise<string> {
    if (this.superAdminId) return this.superAdminId;

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

      this.superAdminId = superAdmin.id;
      console.log('✅ Found super admin ID:', this.superAdminId);
      return this.superAdminId;
    } catch (error) {
      console.error('❌ Failed to get super admin ID:', error);
      throw error;
    }
  }

  // Insert file into PostgreSQL based on chat file/photo/video fields
  private async insertFile(fileName: string, fileKey: string): Promise<string | null> {
    try {
      const [fileRecord] = await db
        .insert(files)
        .values({
          key: fileKey,
          fileName: fileName || 'unknown',
          mimeType: this.getMimeTypeFromFileName(fileName),
          fileSize: '0', // Size not available from MongoDB schema
          fileType: 'document', // Default type for chat files
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: files.id });

      this.stats.addFile();
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

  // Insert chat into PostgreSQL using Drizzle ORM
  private async insertChat(mongoChat: MongoChat): Promise<void> {
    try {
      // Determine sender type and get user IDs
      let senderType: 'user' | 'admin';
      let userId: string;
      let adminId: string | null = null;

      if (mongoChat.senderUserId) {
        // Message from user
        senderType = 'user';
        const pgUserId = this.userIdMap.get(mongoChat.senderUserId.toString());
        if (!pgUserId) {
          throw new Error(
            `PostgreSQL user ID not found for MongoDB user: ${mongoChat.senderUserId}`
          );
        }
        userId = pgUserId;
        this.stats.addUserMessage();
      } else if (mongoChat.senderAdminId && mongoChat.receiverUserId) {
        // Message from admin to user
        senderType = 'admin';
        const pgUserId = this.userIdMap.get(mongoChat.receiverUserId.toString());
        if (!pgUserId) {
          throw new Error(
            `PostgreSQL user ID not found for MongoDB user: ${mongoChat.receiverUserId}`
          );
        }
        userId = pgUserId;
        adminId = await this.getSuperAdminId();
        this.stats.addAdminMessage();
      } else {
        throw new Error('Invalid chat structure - cannot determine sender type');
      }

      // Handle file attachments based on messageType and encrypted fields
      let fileId: string | null = null;
      let content = '';
      let messageType = 'text';

      switch (mongoChat.messageType) {
        case 'TEXT': {
          content = mongoChat.text ?? '';
          messageType = 'text';
          break;
        }
        case 'PHOTO': {
          const photoFileName = mongoChat.originalFileName ?? '';
          content = `Photo: ${photoFileName || 'image'}`;
          messageType = 'image';
          if (mongoChat.file && photoFileName) {
            fileId = await this.insertFile(photoFileName, mongoChat.file);
          }
          break;
        }
        case 'VIDEO': {
          const videoFileName = mongoChat.originalFileName;
          content = `Video: ${videoFileName || 'video'}`;
          messageType = 'video';
          if (mongoChat.video && videoFileName) {
            fileId = await this.insertFile(videoFileName, mongoChat.video);
          }
          break;
        }
        case 'FILE': {
          const fileFileName = mongoChat.originalFileName;
          content = `File: ${fileFileName || 'document'}`;
          messageType = 'file';
          if (mongoChat.file && fileFileName) {
            fileId = await this.insertFile(fileFileName, mongoChat.file);
          }
          break;
        }
        default: {
          content = mongoChat.text ?? '';
          messageType = 'text';
        }
      }

      // Insert chat record
      const [chatRecord] = await db
        .insert(chats)
        .values({
          content,
          messageType: messageType as 'text' | 'file' | 'image' | 'video' | 'audio' | 'document',
          chatType: 'support', // As per your requirement
          senderType,
          userId,
          adminId,
          applicationId: null, // As per your requirement
          fileId,
          isRead: mongoChat.status === 'READ',
          readAt: mongoChat.status === 'READ' ? mongoChat.create_date : null,
          createdAt: mongoChat.create_date || new Date(),
          updatedAt: mongoChat.update_date || new Date(),
          deletedAt: mongoChat.status === 'DELETED' ? mongoChat.update_date : null,
        })
        .returning({ id: chats.id });

      console.log(`✅ Inserted ${mongoChat.messageType} chat with ID: ${chatRecord.id}`);

      // Update MongoDB record with PostgreSQL ID
      await ChatModel.updateOne({ _id: mongoChat._id }, { $set: { pgChatId: chatRecord.id } });
    } catch (error) {
      console.error('Drizzle chat insert error:', error);
      throw error;
    }
  }

  // Main migration function
  async migrateChats(): Promise<void> {
    try {
      // Load user ID mappings first
      await this.loadUserIdMappings();

      // Get super admin ID
      await this.getSuperAdminId();

      // Get total chat count
      this.stats.totalRecords = await ChatModel.countDocuments();

      console.log(`🚀 Starting migration of ${this.stats.totalRecords} chat records`);
      console.log('📊 Progress will be logged every 100 records...\n');

      // Use Mongoose cursor for better memory efficiency
      const cursor = ChatModel.find({}).cursor();
      let processedCount = 0;

      console.log('🔄 Migrating chats...');

      for (
        let mongoChat = await cursor.next();
        mongoChat != null;
        mongoChat = await cursor.next()
      ) {
        processedCount++;

        console.log(true, mongoChat);
        try {
          // Skip chats without essential data
          const hasContent =
            (mongoChat.text as string) || mongoChat.photo || mongoChat.video || mongoChat.file;
          if (!hasContent) {
            console.warn(`⚠️  Skipping chat ${mongoChat._id}: No message content`);
            this.stats.addSkipped();
            continue;
          }

          // Skip if neither senderUserId nor (senderAdminId + receiverUserId) exists
          if (!mongoChat.senderUserId && !(mongoChat.senderAdminId && mongoChat.receiverUserId)) {
            console.warn(`⚠️  Skipping chat ${mongoChat._id}: Invalid sender/receiver structure`);
            this.stats.addSkipped();
            continue;
          }

          await this.insertChat(mongoChat as any);
          this.stats.addSuccess();

          // Log progress every 100 records
          if (processedCount % 100 === 0) {
            console.log(
              `📈 Processed ${processedCount}/${this.stats.totalRecords} chats (${this.stats.successfulMigrations} successful, ${this.stats.userMessages} user msgs, ${this.stats.adminMessages} admin msgs)`
            );
          }
        } catch (error) {
          console.error(`❌ Failed to migrate chat ${mongoChat._id}:`, (error as Error).message);
          this.stats.addError(mongoChat._id as mongoose.Types.ObjectId, error as Error, {
            messageType: mongoChat.messageType,
            text: mongoChat.text as string,
            senderUserId: mongoChat.senderUserId as any,
            senderAdminId: mongoChat.senderAdminId as any,
            receiverUserId: mongoChat.receiverUserId as any,
          });
        }
      }

      this.printMigrationSummary();
    } catch (error) {
      console.error('💥 Chat migration failed:', error);
      throw error;
    }
  }

  // Print migration summary
  private printMigrationSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CHAT MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📋 Total Records: ${this.stats.totalRecords}`);
    console.log(`✅ Successful: ${this.stats.successfulMigrations}`);
    console.log(`👤 User Messages: ${this.stats.userMessages}`);
    console.log(`👨‍💼 Admin Messages: ${this.stats.adminMessages}`);
    console.log(`📁 Files Processed: ${this.stats.filesProcessed}`);
    console.log(`❌ Failed: ${this.stats.failedMigrations}`);
    console.log(`⚠️  Skipped: ${this.stats.skippedRecords}`);
    console.log(`📈 Success Rate: ${this.stats.getSuccessRate()}%`);
    console.log(`⏱️  Duration: ${this.stats.getDuration()} seconds`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ SAMPLE ERRORS (first 5):');
      this.stats.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. Chat ${error.chatId}: ${error.error}`);
      });

      if (this.stats.errors.length > 5) {
        console.log(`  ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Verify chat message integrity and encryption');
    console.log('2. Test chat functionality with migrated data');
    console.log('3. Validate file attachments are accessible');
    console.log('4. Check read/unread status accuracy');
    console.log('='.repeat(60));
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      await this.connect();
      await this.migrateChats();
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Main execution function
async function runChatMigration(): Promise<boolean> {
  try {
    const config = new ChatMigrationConfig();

    console.log('🎯 Starting Chat Migration from MongoDB to PostgreSQL...');
    console.log('💬 Migrating support chats with file attachments...');
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

    const migrator = new ChatMigrator(config);
    await migrator.run();

    console.log('🎉 Chat migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Chat migration failed:', error);
    return false;
  }
}

// Export for use in other scripts
export { ChatMigrator, ChatMigrationConfig, runChatMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runChatMigration()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
