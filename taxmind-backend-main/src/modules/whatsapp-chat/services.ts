import axios from 'axios';
import { SQL, and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, models } from '@/database';
import logger from '@/logger';
import ApiError from '@/utils/apiError';
import { hashTrigrams, hashWithHMAC } from '@/utils/crypto';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  downloadMediaSchema,
  listConversationsSchema,
  listMessagesSchema,
  markReadSchema,
  sendMessageSchema,
} from './validations';

// Types for WhatsApp webhook data
interface MediaInfo {
  id: string;
  mimeType: string;
  sha256: string;
  caption?: string;
  voice?: boolean;
  filename?: string;
  animated?: boolean;
}

interface BaseMessageInfo {
  mobileNumber: string;
  contactName: string | null;
  messageType: string;
  messageId: string;
  timestamp: string;
  metadata: any;
}

interface TextMessageInfo extends BaseMessageInfo {
  messageType: 'text';
  messageText: string;
}

interface MediaMessageInfo extends BaseMessageInfo {
  messageType: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  media: MediaInfo;
}

interface OtherMessageInfo extends BaseMessageInfo {
  messageText: null;
}

type MessageInfo = TextMessageInfo | MediaMessageInfo | OtherMessageInfo;

// WhatsApp API Response types
interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

interface MediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}

export const verifyWebhook = serviceHandler(async (req, res) => {
  console.info('GET request received for webhook verification', req.query);

  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === process.env.WA_WEBHOOK_VERIFY_TOKEN) {
    console.info('WEBHOOK VERIFIED SUCCESSFULLY');
    res.status(200).send(challenge);
  } else {
    console.error('Webhook verification failed', {
      mode,
      token,
      expected: process.env.WA_WEBHOOK_VERIFY_TOKEN,
    });
    res.status(403).end();
  }
});

// WhatsApp API functions
const whatsappAPI = {
  /**
   * Send a text message via WhatsApp API
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Text message to send
   * @returns {Promise<Object>} API response
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<WhatsAppApiResponse> {
    const apiUrl = `${process.env.WA_BASE_URL}/${process.env.WA_MOBILE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
      'Content-Type': 'application/json',
    };
    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message,
        preview_url: true,
      },
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      // Generate trigram hashes for phone exact matching
      const phoneTrigramHashes = hashTrigrams(phoneNumber);

      let user = await db.query.users.findFirst({
        where: and(
          sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
            phoneTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
            phoneTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[]`,
          isNull(models.users.deletedAt)
        ),
      });
      await db.insert(models.whatsappChats).values({
        content: message,
        messageType: 'text',
        senderType: 'admin',
        phone: phoneNumber,
        hashedPhone: hashWithHMAC(phoneNumber),
        isRead: true,
        userId: user?.id || null,
        isRegistered: !!user,
      });
      logger.info(`Message sent to ${phoneNumber}`, response.data);
      return response.data;
    } catch (error: any) {
      console.log(error.response?.data?.error || error.message);
      throw error.response?.data?.error || error.message;
    }
  },

  /**
   * Send a template message via WhatsApp API
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} templateName - Template name
   * @param {string} languageCode - Language code (default: en_US)
   * @returns {Promise<Object>} API response
   */
  async sendTemplateMessage(
    phoneNumber: string,
    templateName: string = 'hello_world',
    languageCode: string = 'en_US'
  ): Promise<WhatsAppApiResponse> {
    const apiUrl = `${process.env.WA_BASE_URL}/${process.env.WA_MOBILE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
      'Content-Type': 'application/json',
    };
    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      logger.info(`Template message sent to ${phoneNumber}`, response.data);
      return response.data;
    } catch (error: any) {
      logger.error(
        `Failed to send template to ${phoneNumber}`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Get media URL from WhatsApp API using media ID
   * @param {string} mediaId - Media ID from webhook
   * @returns {Promise<Object>} Media URL and details
   */
  async getMediaUrl(mediaId: string): Promise<MediaUrlResponse> {
    const apiUrl = `${process.env.WA_BASE_URL}/${mediaId}`;
    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
    };

    try {
      const response = await axios.get(apiUrl, { headers });
      logger.info(`Media URL retrieved for ID: ${mediaId}`, response.data);
      return response.data;
    } catch (error: any) {
      logger.error(
        `Failed to get media URL for ID: ${mediaId}`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Send media message via WhatsApp API using media ID
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} mediaType - Type of media (image, video, audio, document)
   * @param {string} mediaId - Media ID from WhatsApp API
   * @param {string} caption - Optional caption for the media
   * @param {string} filename - Optional filename (for documents)
   * @returns {Promise<Object>} API response
   */
  async sendMediaMessage(
    phoneNumber: string,
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    mediaId: string,
    caption: string | null = null,
    fileName: string | null = null
  ): Promise<WhatsAppApiResponse> {
    const apiUrl = `${process.env.WA_BASE_URL}/${process.env.WA_MOBILE_NUMBER_ID}/messages`;
    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Build media object based on type - using media ID
    const mediaObject: any = {
      id: mediaId, // Use 'id' for media IDs
    };

    if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
      mediaObject.caption = caption;
    }

    if (fileName && mediaType === 'document') {
      mediaObject.filename = fileName;
    }

    const data = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: mediaType,
      [mediaType]: mediaObject,
    };

    try {
      const response = await axios.post(apiUrl, data, { headers });
      const phoneTrigramHashes = hashTrigrams(phoneNumber);
      let user = await db.query.users.findFirst({
        where: and(
          sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
            phoneTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
            phoneTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[]`,
          isNull(models.users.deletedAt)
        ),
      });
      logger.info(`${mediaType} message sent to ${phoneNumber}`, {
        mediaId,
        caption,
        fileName,
        response: response.data,
      });
      const mediaDetails = await this.getMediaUrl(mediaId);
      await db.insert(models.whatsappChats).values({
        content: caption,
        messageType: mediaType,
        senderType: 'admin',
        phone: phoneNumber,
        hashedPhone: hashWithHMAC(phoneNumber),
        mediaId: mediaId,
        url: mediaDetails.url,
        mimeType: mediaDetails.mime_type,
        isRead: true,
        fileName: fileName || null,
        userId: user?.id || null,
        isRegistered: !!user,
      });
      return response.data;
    } catch (error: any) {
      logger.error(
        `Failed to send ${mediaType} to ${phoneNumber}`,
        error.response?.data || error.message
      );
      throw error;
    }
  },

  /**
   * Send image message using media ID
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} imageId - Image media ID
   * @param {string} caption - Optional caption
   * @returns {Promise<Object>} API response
   */
  async sendImageMessage(
    phoneNumber: string,
    imageId: string,
    caption: string | null = null
  ): Promise<WhatsAppApiResponse> {
    return this.sendMediaMessage(phoneNumber, 'image', imageId, caption);
  },

  /**
   * Send video message using media ID
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} videoId - Video media ID
   * @param {string} caption - Optional caption
   * @returns {Promise<Object>} API response
   */
  async sendVideoMessage(
    phoneNumber: string,
    videoId: string,
    caption: string | null = null
  ): Promise<WhatsAppApiResponse> {
    return this.sendMediaMessage(phoneNumber, 'video', videoId, caption);
  },

  /**
   * Send audio message using media ID
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} audioId - Audio media ID
   * @returns {Promise<Object>} API response
   */
  async sendAudioMessage(phoneNumber: string, audioId: string): Promise<WhatsAppApiResponse> {
    return this.sendMediaMessage(phoneNumber, 'audio', audioId);
  },

  /**
   * Send document message using media ID
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} documentId - Document media ID
   * @param {string} caption - Optional caption
   * @param {string} filename - Optional filename
   * @returns {Promise<Object>} API response
   */
  async sendDocumentMessage(
    phoneNumber: string,
    documentId: string,
    caption: string | null = null,
    filename: string | null = null
  ): Promise<WhatsAppApiResponse> {
    return this.sendMediaMessage(phoneNumber, 'document', documentId, caption, filename);
  },

  /**
   * Upload media to WhatsApp and get media ID
   * @param {Buffer|string} media - Media file buffer or file path
   * @param {string} mimeType - MIME type of the media
   * @param {string} filename - Optional filename
   * @returns {Promise<Object>} Upload response with media ID
   */
  async uploadMedia(
    media: Buffer | string,
    mimeType: string,
    filename?: string
  ): Promise<{ id: string }> {
    const apiUrl = `${process.env.WA_BASE_URL}/${process.env.WA_MOBILE_NUMBER_ID}/media`;

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('messaging_product', 'whatsapp');
    formData.append('type', mimeType);

    if (Buffer.isBuffer(media)) {
      formData.append('file', media, filename || 'media_file');
    } else {
      // If media is a file path, you'll need to read it first
      const fs = require('fs');
      formData.append('file', fs.createReadStream(media));
    }

    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post(apiUrl, formData, { headers });
      logger.info('Media uploaded successfully', {
        mediaId: response.data.id,
        mimeType,
        filename,
      });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to upload media', error.response?.data || error.message);
      throw error;
    }
  },
  /**
   * Download media file from WhatsApp API
   * @param {string} mediaUrl - Media URL from getMediaUrl
   * @returns {Promise<Buffer>} Media file buffer
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const headers = {
      Authorization: `Bearer ${process.env.WA_API_TOKEN}`,
    };

    try {
      const response = await axios.get(mediaUrl, {
        headers,
        responseType: 'arraybuffer',
      });
      logger.info(`Media downloaded successfully from: ${mediaUrl}`);
      return response.data;
    } catch (error: any) {
      logger.error(
        `Failed to download media from: ${mediaUrl}`,
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
// Webhook payload parsing utilities
const webhookParser = {
  /**
   * Extract message data from WhatsApp webhook payload
   * @param {Object} webhookData - Raw webhook payload
   * @returns {Object|null} Parsed message data or null
   */
  parseMessageData(webhookData: any) {
    // Check for new WhatsApp webhook structure: entry[0].changes[0].value
    if (webhookData.entry && webhookData.entry.length > 0) {
      const entry = webhookData.entry[0];
      if (entry.changes && entry.changes.length > 0) {
        const change = entry.changes[0];
        if (change.field === 'messages' && change.value) {
          return change.value;
        }
      }
    }
    // Fallback to old structure
    else if (webhookData.value) {
      return webhookData.value;
    }

    return null;
  },

  /**
   * Extract structured message information
   * @param {Object} messageData - Message data from webhook
   * @returns {Object|null} Structured message info or null
   */
  extractMessageInfo(messageData: any): MessageInfo | null {
    if (!messageData || !messageData.messages || messageData.messages.length === 0) {
      return null;
    }

    const message = messageData.messages[0];
    const contact = messageData.contacts && messageData.contacts[0];

    const baseInfo = {
      mobileNumber: message.from,
      contactName: contact?.profile?.name || null,
      messageType: message.type,
      messageId: message.id,
      timestamp: message.timestamp,
      metadata: messageData.metadata,
    };

    // Handle different message types
    switch (message.type) {
      case 'text':
        return {
          ...baseInfo,
          messageText: message.text?.body || null,
        };

      case 'image':
        return {
          ...baseInfo,
          media: {
            id: message.image.id,
            mimeType: message.image.mime_type,
            sha256: message.image.sha256,
            caption: message.image.caption || null,
          },
        };

      case 'video':
        return {
          ...baseInfo,
          media: {
            id: message.video.id,
            mimeType: message.video.mime_type,
            sha256: message.video.sha256,
            caption: message.video.caption || null,
          },
        };

      case 'audio':
        return {
          ...baseInfo,
          media: {
            id: message.audio.id,
            mimeType: message.audio.mime_type,
            sha256: message.audio.sha256,
            voice: message.audio.voice || false,
          },
        };

      case 'document':
        return {
          ...baseInfo,
          media: {
            id: message.document.id,
            filename: message.document.filename,
            mimeType: message.document.mime_type,
            sha256: message.document.sha256,
            caption: message.document.caption || null,
          },
        };

      case 'sticker':
        return {
          ...baseInfo,
          media: {
            id: message.sticker.id,
            mimeType: message.sticker.mime_type,
            sha256: message.sticker.sha256,
            animated: message.sticker.animated || false,
          },
        };

      default:
        return {
          ...baseInfo,
          messageText: null,
        };
    }
  },
};

export const handleWebhookEvent = serviceHandler(async (req, res) => {
  console.info('POST request received for webhook event', req.body);
  const messageData = webhookParser.parseMessageData(req.body);

  if (!messageData) {
    console.info('Non-message webhook received');
    res.status(200).end();
    return;
  }

  // Extract structured message information
  const messageInfo = webhookParser.extractMessageInfo(messageData);

  if (!messageInfo) {
    console.info('No valid message found in webhook data');
    res.status(200).end();
    return;
  }

  console.info('Processed WhatsApp message:', {
    mobileNumber: messageInfo.mobileNumber,
    contactName: messageInfo.contactName,
    messageType: messageInfo.messageType,
    messageId: messageInfo.messageId,
    timestamp: messageInfo.timestamp,
  });

  // TODO: Process the message (save to database, send to chat handler, etc.)
  // check mobile number is registered user or not
  // notify admin or user based on senderType
  // Assuming you have a Drizzle ORM database instance named 'db'
  // Try to parse the phone number with Ireland as default country
  const phoneNumber = `+${messageInfo.mobileNumber}`;
  const phoneTrigramHashes = hashTrigrams(phoneNumber);
  const hashedPhone = hashWithHMAC(phoneNumber);
  let user = await db.query.users.findFirst({
    where: and(
      sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
        phoneTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
        phoneTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      isNull(models.users.deletedAt)
    ),
  });

  // Example processing based on message type:
  switch (messageInfo.messageType) {
    case 'text':
      console.info('Text message received:', (messageInfo as TextMessageInfo).messageText);
      // Handle text message logic here
      await db.insert(models.whatsappChats).values({
        userId: user ? user.id : null,
        phone: phoneNumber,
        hashedPhone: hashedPhone,
        content: (messageInfo as TextMessageInfo).messageText,
        messageType: messageInfo.messageType,
        senderType: 'user',
        isRegistered: user ? true : false,
      });
      break;

    case 'image':
    case 'video':
    case 'audio':
    case 'document':
    case 'sticker': {
      console.info('Media message received:', (messageInfo as MediaMessageInfo).media);
      // Handle media message logic here
      const mediaDetails = await whatsappAPI.getMediaUrl(
        (messageInfo as MediaMessageInfo).media.id
      );
      await db.insert(models.whatsappChats).values({
        userId: user ? user.id : null,
        phone: phoneNumber,
        content: (messageInfo as MediaMessageInfo).media.caption,
        messageType: messageInfo.messageType,
        senderType: 'user',
        isRegistered: user ? true : false,
        mediaId: (messageInfo as MediaMessageInfo).media.id,
        mimeType: mediaDetails.mime_type,
        url: mediaDetails.url,
        hashedPhone: hashedPhone,
      });
      break;
    }

    default:
      console.info('Unknown message type received:', messageInfo.messageType);
  }
  // Send acknowledgment response

  // check older messages exists or not
  const olderMessages = await db.query.whatsappChats.findMany({
    where: eq(models.whatsappChats.hashedPhone, hashedPhone),
    orderBy: [desc(models.whatsappChats.createdAt)],
    limit: 2,
  });
  if (user) {
    if (olderMessages.length === 1) {
      await whatsappAPI.sendTextMessage(
        phoneNumber,
        'Thanks for connecting to TaxMind Whatsapp Support.We have received your message and will get back to you shortly.'
      );
    }
  } else {
    if (olderMessages.length === 1) {
      await whatsappAPI.sendTextMessage(
        phoneNumber,
        'Welcome to TaxMind whatsapp support. We have received your message and will get back to you shortly.'
      );
    }
  }

  // Always respond with 200 to acknowledge receipt
  res.status(200).end();
  return;
});

export const listConversations = serviceHandler(listConversationsSchema, async (req, res) => {
  const { type } = req.query;
  const { limit, offset, page, size } = req.pagination;

  const baseConditions = [isNull(models.whatsappChats.deletedAt)];
  if (type === 'registered') {
    baseConditions.push(eq(models.whatsappChats.isRegistered, true));
  } else if (type === 'unregistered') {
    baseConditions.push(eq(models.whatsappChats.isRegistered, false));
  }

  // Optimized approach: Get phone ranking and messages in parallel, then batch latest messages
  const [totalConversations, phoneRanking] = await Promise.all([
    // Count distinct phones for total conversation count
    db
      .select({ count: sql<number>`count(distinct ${models.whatsappChats.hashedPhone})` })
      .from(models.whatsappChats)
      .where(and(...baseConditions)),

    // Get paginated list of phone numbers with their latest message timestamps
    db
      .select({
        hashedPhone: models.whatsappChats.hashedPhone,
        maxCreatedAt: sql`max(${models.whatsappChats.createdAt})`.as('max_created_at'),
      })
      .from(models.whatsappChats)
      .where(and(...baseConditions))
      .groupBy(models.whatsappChats.hashedPhone)
      .orderBy(sql`max(${models.whatsappChats.createdAt}) desc`)
      .limit(limit)
      .offset(offset),
  ]);

  if (phoneRanking.length === 0) {
    return res.data('Conversations fetched', [], {
      page,
      size,
      total: +totalConversations[0].count,
    });
  }

  const hashedPhones = phoneRanking.map((p) => p.hashedPhone);

  // Get latest messages and unread counts in parallel
  const [latestMessages, unreadRows] = await Promise.all([
    // Get all latest messages in a single query using subquery
    db
      .select({
        whatsappChatId: models.whatsappChats.id,
        content: models.whatsappChats.content,
        messageType: models.whatsappChats.messageType,
        senderType: models.whatsappChats.senderType,
        createdAt: models.whatsappChats.createdAt,
        userId: models.users.id,
        userName: models.users.name,
        phone: models.whatsappChats.phone,
        hashedPhone: models.whatsappChats.hashedPhone,
      })
      .from(models.whatsappChats)
      .leftJoin(models.users, eq(models.users.id, models.whatsappChats.userId))
      .where(
        and(
          ...baseConditions,
          inArray(models.whatsappChats.hashedPhone, hashedPhones),
          // Only get messages that are the latest for their phone
          sql`${models.whatsappChats.createdAt} = (
            SELECT MAX(wc2.created_at) 
            FROM whatsapp_chats wc2 
            WHERE wc2.hashed_phone = ${models.whatsappChats.hashedPhone} 
            AND wc2.deleted_at IS NULL
            ${
              type === 'registered'
                ? sql`AND wc2.is_registered = true`
                : type === 'unregistered'
                  ? sql`AND wc2.is_registered = false`
                  : sql``
            }
          )`
        )
      ),

    // Get unread counts for all phones at once
    db
      .select({
        hashedPhone: models.whatsappChats.hashedPhone,
        cnt: sql<number>`count(${models.whatsappChats.id})`,
      })
      .from(models.whatsappChats)
      .leftJoin(
        models.adminReadWhatsappChats,
        and(
          eq(models.adminReadWhatsappChats.whatsappChatId, models.whatsappChats.id),
          eq(models.adminReadWhatsappChats.adminId, req.admin.id)
        )
      )
      .where(
        and(
          isNull(models.whatsappChats.deletedAt),
          eq(models.whatsappChats.senderType, 'user'),
          sql`admin_read_whatsapp_chats.whatsapp_chat_id IS NULL`,
          inArray(models.whatsappChats.hashedPhone, hashedPhones)
        )
      )
      .groupBy(models.whatsappChats.hashedPhone),
  ]);

  // Create unread count map
  const unreadMap = new Map(unreadRows.map((r) => [r.hashedPhone, Number(r.cnt)]));

  // Sort messages by the original phone ranking order
  const phoneOrder = new Map(phoneRanking.map((p, index) => [p.hashedPhone, index]));
  const sortedMessages = latestMessages.sort((a, b) => {
    const orderA = phoneOrder.get(a.hashedPhone) ?? Infinity;
    const orderB = phoneOrder.get(b.hashedPhone) ?? Infinity;
    return orderA - orderB;
  });

  const result = sortedMessages.map((r) => ({
    id: r.whatsappChatId,
    content: r.content,
    messageType: r.messageType,
    // senderType: r.senderType,
    senderType: "user", // Hardcoded to cheat the type inference issue. Needs proper fix later on frontend.
    createdAt: r.createdAt, 
    user: r.userId ? { id: r.userId, name: (r.userName as unknown as string) || null } : null,
    unreadCount: unreadMap.get(r.hashedPhone) || 0,
    phone: r.phone,
  }));

  return res.data('Conversations fetched', result, {
    page,
    size,
    total: +totalConversations[0].count,
  });
});

export const listMessages = serviceHandler(listMessagesSchema, async (req, res) => {
  const { phone, userId } = req.query;
  const { limit, offset, page, size } = req.pagination;

  const conditions: (SQL | undefined)[] = [isNull(models.whatsappChats.deletedAt)];

  if (!userId && (!phone || phone.trim() === '')) {
    throw new ApiError('Either userId or phone is required', 400);
  }

  if (userId) {
    conditions.push(eq(models.whatsappChats.userId, userId));
  } else if (typeof phone === 'string' && phone.trim() !== '') {
    const hashedPhone = hashWithHMAC(phone);
    conditions.push(eq(models.whatsappChats.hashedPhone, hashedPhone));
  } else {
    throw new ApiError('Either userId or a valid phonenumber is required', 400);
  }

  const [totalMessages, messages] = await Promise.all([
    db
      .select({ count: sql<number>`count(${models.whatsappChats.id})` })
      .from(models.whatsappChats)
      .where(and(...conditions)),
    db
      .select()
      .from(models.whatsappChats)
      .where(and(...conditions))
      .orderBy(desc(models.whatsappChats.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const formattedMessages = messages.map((r) => ({
    id: r.id,
    content: r.content,
    messageType: r.messageType,
    senderType: r.senderType,
    createdAt: r.createdAt,
    mediaId: r.mediaId,
    mimeType: r.mimeType,
    url: r.url,
    isRegistered: r.isRegistered,
    phone: r.phone,
    userId: r.userId,
  }));

  return res.data('Messages fetched', formattedMessages, {
    page,
    size,
    total: +totalMessages[0].count,
  });
});

export const markRead = serviceHandler(markReadSchema, async (req, res) => {
  const { phone, userId } = req.body;
  if (!userId && (!phone || phone.trim() === '')) {
    throw new ApiError('Either userId or phone is required', 400);
  }

  // Build conditions to select relevant messages needing read receipt / update
  const baseConditions: (SQL | undefined)[] = [isNull(models.whatsappChats.deletedAt)];

  if (userId) {
    baseConditions.push(eq(models.whatsappChats.userId, userId));
  } else if (typeof phone === 'string' && phone.trim() !== '') {
    const hashedPhone = hashWithHMAC(phone);
    baseConditions.push(eq(models.whatsappChats.hashedPhone, hashedPhone));
  } else {
    throw new ApiError('Either userId or a valid phonenumber is required', 400);
  }

  // Admin marking user messages (senderType=user) as read: add receipt rows
  baseConditions.push(eq(models.whatsappChats.senderType, 'user'));

  const unreadUserMessages = await db
    .select({ id: models.whatsappChats.id })
    .from(models.whatsappChats)
    .leftJoin(
      models.adminReadWhatsappChats,
      and(
        eq(models.adminReadWhatsappChats.whatsappChatId, models.whatsappChats.id),
        eq(models.adminReadWhatsappChats.adminId, req.admin.id)
      )
    )
    .where(and(...baseConditions, sql`admin_read_whatsapp_chats.whatsapp_chat_id IS NULL`));

  if (!unreadUserMessages.length) return res.success('No messages to mark');

  const rows = unreadUserMessages.map((m) => ({ whatsappChatId: m.id, adminId: req.admin.id }));
  await db.insert(models.adminReadWhatsappChats).values(rows).onConflictDoNothing();

  return res.success('Messages marked read');
});
export const sendMessage = serviceHandler(sendMessageSchema, async (req, res) => {
  const { phone, messageType, content, mediaId, fileName } = req.body;

  // Validate and process the incoming message data
  if (!phone || phone.trim() === '') {
    throw new ApiError('Phone number is required', 400);
  }

  if (messageType === 'text' && (!content || content.trim() === '')) {
    throw new ApiError('Content is required for text messages', 400);
  }
  if (messageType !== 'text' && (!mediaId || mediaId.trim() === '')) {
    throw new ApiError('mediaId is required for media messages', 400);
  }
  if (messageType !== 'text' && (!fileName || fileName.trim() === '')) {
    throw new ApiError('fileName is required for media messages', 400);
  }
  if (messageType === 'text') {
    await whatsappAPI.sendTextMessage(phone, content as string);
  } else {
    await whatsappAPI.sendMediaMessage(
      phone,
      messageType,
      mediaId as string,
      content || null,
      fileName || null
    );
  }
  return res.success('Message sent');
});
export const downloadMedia = serviceHandler(downloadMediaSchema, async (req, res) => {
  const { messageId } = req.body;

  if (!messageId || messageId.trim() === '') {
    throw new ApiError('messageId is required to download media', 400);
  }

  const message = await db
    .select()
    .from(models.whatsappChats)
    .where(and(isNull(models.whatsappChats.deletedAt), eq(models.whatsappChats.id, messageId)))
    .limit(1);

  if (!message) {
    throw new ApiError('Message not found', 404);
  }
  if (!message[0].url) {
    throw new ApiError('No media URL found for this message', 400);
  }
  console.log(true, 'Downloading media from URL:', message[0].url);
  const data = await whatsappAPI.getMediaUrl(message[0].mediaId as string);
  console.log(true, 'Media URL details:', data);
  const file = await whatsappAPI.downloadMedia(data.url as string);

  // Set headers
  res.setHeader('Content-Disposition', `attachment; filename="${message[0].fileName || 'media'}"`);
  res.setHeader('Content-Type', data.mime_type);

  res.send(file);
  return;
});
