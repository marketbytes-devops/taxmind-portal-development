import { SQL, and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, models } from '@/database';
import { getPresignedGetObjectUrl } from '@/integrations/awsS3';
import logger from '@/logger';
import ApiError from '@/utils/apiError';
import { serviceHandler } from '@/utils/serviceHandler';

import { listConversationsSchema, listMessagesSchema, markReadSchema } from './validations';

type ChatRow = typeof models.chats.$inferSelect & {
  file?: {
    id: string;
    key: string;
    mimeType: string | null;
    fileName?: string | null;
    url?: string;
  } | null;
};

const enrichMessage = async (message: ChatRow): Promise<ChatRow> => {
  if (!message?.fileId) return message;
  try {
    const file = await db.query.files.findFirst({
      where: eq(models.files.id, message.fileId),
      columns: { id: true, key: true, mimeType: true, fileName: true },
    });
    if (file?.key) {
      const url = await getPresignedGetObjectUrl(file.key);
      return { ...message, file: { ...file, url } } as ChatRow;
    }
  } catch (e) {
    logger.warn('Failed to generate presigned URL for chat file', {
      fileId: message.fileId,
      error: (e as Error).message,
    });
  }
  return message;
};

// Reusable message creation (for socket layer)
export const createChatMessage = async (input: {
  chatType: 'application' | 'support';
  content: string;
  messageType: 'text' | 'file' | 'image' | 'video' | 'audio' | 'document';
  applicationId?: string;
  fileId?: string;
  userId: string;
  adminId?: string;
  senderType: 'user' | 'admin';
}): Promise<ChatRow> => {
  const [inserted] = await db
    .insert(models.chats)
    .values({
      chatType: input.chatType,
      content: input.content,
      messageType: input.messageType,
      applicationId: input.chatType === 'application' ? input.applicationId || null : null,
      fileId: input.fileId || null,
      userId: input.userId,
      adminId: input.adminId || null,
      senderType: input.senderType,
    })
    .returning();

  return enrichMessage(inserted as ChatRow);
};

// ===================================================================================================

export const listAdminSupportConversations = serviceHandler(
  listConversationsSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;

    const baseConditions = [isNull(models.chats.deletedAt), eq(models.chats.chatType, 'support')];

    // Subquery for latest message per user (direct chats)
    const latestDirect = db
      .select({
        userId: models.chats.userId,
        maxCreatedAt: sql`max(${models.chats.createdAt})`.as('max_created_at'),
      })
      .from(models.chats)
      .where(and(...baseConditions))
      .groupBy(models.chats.userId)
      .as('latest_direct');

    const [totalConversations, rows] = await Promise.all([
      // Count distinct users for total conversation count
      db
        .select({ count: sql<number>`count(distinct ${models.chats.userId})` })
        .from(models.chats)
        .where(and(...baseConditions)),

      // Join back and apply ordering + pagination at DB level
      db
        .select({
          chatId: models.chats.id,
          content: models.chats.content,
          messageType: models.chats.messageType,
          chatType: models.chats.chatType,
          senderType: models.chats.senderType,
          createdAt: models.chats.createdAt,
          userId: models.users.id,
          userName: models.users.name,
        })
        .from(models.chats)
        .innerJoin(
          latestDirect,
          and(
            eq(models.chats.userId, latestDirect.userId),
            eq(models.chats.createdAt, latestDirect.maxCreatedAt)
          )
        )
        .innerJoin(models.users, eq(models.users.id, models.chats.userId))
        .where(and(...baseConditions))
        .orderBy(desc(models.chats.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const userIds = Array.from(new Set(rows.map((r) => r.userId)));

    // Unread counts per conversation for this admin: messages from user -> not read by this admin
    // Use a single aggregate query
    let unreadMap = new Map<string, number>();
    if (userIds.length) {
      const unreadRows = await db
        .select({
          userId: models.chats.userId,
          cnt: sql<number>`count(${models.chats.id})`,
        })
        .from(models.chats)
        .leftJoin(
          models.adminReadChats,
          and(
            eq(models.adminReadChats.chatId, models.chats.id),
            eq(models.adminReadChats.adminId, req.admin.id)
          )
        )
        .where(
          and(
            isNull(models.chats.deletedAt),
            eq(models.chats.chatType, 'support'),
            eq(models.chats.senderType, 'user'),
            sql`admin_read_chats.chat_id IS NULL`,
            inArray(models.chats.userId, userIds)
          )
        )
        .groupBy(models.chats.userId);

      unreadMap = new Map(unreadRows.map((r) => [r.userId, Number(r.cnt)]));
    }

    const result = rows.map((r) => ({
      id: r.chatId,
      content: r.content,
      messageType: r.messageType,
      chatType: r.chatType,
      senderType: r.senderType,
      createdAt: r.createdAt,
      user: { id: r.userId, name: (r.userName as unknown as string) || null },
      unreadCount: unreadMap.get(r.userId) || 0,
    }));

    return res.data('Conversations fetched', result, {
      page,
      size,
      total: +totalConversations[0].count,
    });
  }
);

// GET /v1/chat/admins/application-conversations (latest per application)
export const listAdminApplicationConversations = serviceHandler(
  listConversationsSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;

    const baseConditions = [
      isNull(models.chats.deletedAt),
      eq(models.chats.chatType, 'application'),
      // only rows with applicationId
      sql`${models.chats.applicationId} IS NOT NULL`,
    ];

    // Subquery: latest message per application
    const latestApp = db
      .select({
        applicationId: models.chats.applicationId,
        maxCreatedAt: sql`max(${models.chats.createdAt})`.as('max_created_at'),
      })
      .from(models.chats)
      .where(and(...baseConditions))
      .groupBy(models.chats.applicationId)
      .as('latest_app');

    const [totalConversations, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(distinct ${models.chats.applicationId})` })
        .from(models.chats)
        .where(and(...baseConditions)),
      db
        .select({
          chatId: models.chats.id,
          content: models.chats.content,
          messageType: models.chats.messageType,
          chatType: models.chats.chatType,
          senderType: models.chats.senderType,
          createdAt: models.chats.createdAt,
          applicationId: models.applications.id,
          applicationNo: models.applications.applicationNo,
          applicationUserId: models.applications.userId,
          applicationYear: models.applications.year,
          userId: models.users.id,
          userName: models.users.name,
        })
        .from(models.chats)
        .innerJoin(
          latestApp,
          and(
            eq(models.chats.applicationId, latestApp.applicationId),
            eq(models.chats.createdAt, latestApp.maxCreatedAt)
          )
        )
        .innerJoin(models.applications, eq(models.applications.id, models.chats.applicationId))
        .innerJoin(models.users, eq(models.users.id, models.applications.userId))
        .where(and(...baseConditions))
        .orderBy(desc(models.chats.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const applicationIds = Array.from(new Set(rows.map((r) => r.applicationId).filter(Boolean)));

    // Unread counts for each application: user messages in that application not read by this admin
    let unreadMap = new Map<string, number>();
    if (applicationIds.length) {
      const unreadRows = await db
        .select({
          applicationId: models.chats.applicationId,
          cnt: sql<number>`count(${models.chats.id})`,
        })
        .from(models.chats)
        .leftJoin(
          models.adminReadChats,
          and(
            eq(models.adminReadChats.chatId, models.chats.id),
            eq(models.adminReadChats.adminId, req.admin.id)
          )
        )
        .where(
          and(
            isNull(models.chats.deletedAt),
            eq(models.chats.chatType, 'application'),
            eq(models.chats.senderType, 'user'),
            sql`admin_read_chats.chat_id IS NULL`,
            inArray(models.chats.applicationId, applicationIds)
          )
        )
        .groupBy(models.chats.applicationId);
      unreadMap = new Map(unreadRows.map((r) => [r.applicationId as string, Number(r.cnt)]));
    }

    const result = rows.map((r) => ({
      id: r.chatId,
      content: r.content,
      messageType: r.messageType,
      chatType: r.chatType,
      senderType: r.senderType,
      createdAt: r.createdAt,
      application: {
        id: r.applicationId,
        applicationNo: r.applicationNo,
        year: r.applicationYear,
        user: { id: r.userId, name: (r.userName as unknown as string) || null },
      },
      unreadCount: unreadMap.get(r.applicationId) || 0,
    }));

    return res.data('Application conversations fetched', result, {
      page,
      size,
      total: +totalConversations[0].count,
    });
  }
);

// GET /v1/chat/messages (messages list)
export const listMessages = serviceHandler(listMessagesSchema, async (req, res) => {
  const { applicationId, userId } = req.query;
  const { limit, offset, page, size } = req.pagination;

  const isAdmin = !!req.admin;

  const conditions: (SQL | undefined)[] = [isNull(models.chats.deletedAt)];

  if (isAdmin && !userId && !applicationId) {
    throw new ApiError('Either userId or applicationId is required for admin', 400);
  }

  if (!isAdmin) {
    conditions.push(eq(models.chats.userId, req.user.id));
  } else if (userId) {
    conditions.push(eq(models.chats.userId, userId));
  }

  if (applicationId) {
    conditions.push(eq(models.chats.applicationId, applicationId));
    conditions.push(eq(models.chats.chatType, 'application'));
  } else {
    conditions.push(eq(models.chats.chatType, 'support'));
  }

  const [totalMessages, messages] = await Promise.all([
    db
      .select({ count: sql<number>`count(${models.chats.id})` })
      .from(models.chats)
      .where(and(...conditions)),
    db
      .select()
      .from(models.chats)
      .where(and(...conditions))
      .orderBy(desc(models.chats.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const enriched = await Promise.all(messages.map(enrichMessage));
  const formattedMessages = enriched.map((r) => ({
    id: r.id,
    content: r.content,
    messageType: r.messageType,
    chatType: r.chatType,
    senderType: r.senderType,
    createdAt: r.createdAt,
    file: r.file || null,
  }));

  return res.data('Messages fetched', formattedMessages, {
    page,
    size,
    total: +totalMessages[0].count,
  });
});

// POST /v1/chat/read
export const markRead = serviceHandler(markReadSchema, async (req, res) => {
  const { chatType, userId, applicationId } = req.body as {
    chatType: 'application' | 'support';
    userId?: string;
    applicationId?: string;
  };
  const isAdmin = !!req.admin;

  // Build conditions to select relevant messages needing read receipt / update
  const baseConditions: (SQL | undefined)[] = [
    isNull(models.chats.deletedAt),
    eq(models.chats.chatType, chatType),
  ];

  if (chatType === 'application') {
    baseConditions.push(eq(models.chats.applicationId, applicationId!));
  } else {
    // direct chat: bound to a user
    if (isAdmin) {
      if (!userId) throw new ApiError('userId required for support chat', 400);
      baseConditions.push(eq(models.chats.userId, userId));
    } else {
      baseConditions.push(eq(models.chats.userId, req.user.id));
    }
  }

  if (!isAdmin) {
    // User marking messages addressed to them (sent by admins) as read
    baseConditions.push(eq(models.chats.userId, req.user.id));
    baseConditions.push(eq(models.chats.senderType, 'admin'));
    // Fetch IDs to update
    const toMark = await db
      .select({ id: models.chats.id })
      .from(models.chats)
      .where(and(...baseConditions, eq(models.chats.isRead, false)));

    if (!toMark.length) return res.success('No messages to mark');

    await db
      .update(models.chats)
      .set({ isRead: true, readAt: new Date() })
      .where(
        inArray(
          models.chats.id,
          toMark.map((m) => m.id)
        )
      );
  } else {
    // Admin marking user messages (senderType=user) as read: add receipt rows
    baseConditions.push(eq(models.chats.senderType, 'user'));

    const unreadUserMessages = await db
      .select({ id: models.chats.id })
      .from(models.chats)
      .leftJoin(
        models.adminReadChats,
        and(
          eq(models.adminReadChats.chatId, models.chats.id),
          eq(models.adminReadChats.adminId, req.admin.id)
        )
      )
      .where(and(...baseConditions, sql`admin_read_chats.chat_id IS NULL`));

    if (!unreadUserMessages.length) return res.success('No messages to mark');

    const rows = unreadUserMessages.map((m) => ({ chatId: m.id, adminId: req.admin.id }));
    await db.insert(models.adminReadChats).values(rows).onConflictDoNothing();
  }

  return res.success('Messages marked read');
});
