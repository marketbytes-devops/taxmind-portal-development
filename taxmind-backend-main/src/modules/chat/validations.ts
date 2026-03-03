import { z } from 'zod';

export const chatTypeEnum = z.enum(['application', 'support']);
export const messageTypeEnum = z.enum(['text', 'file', 'image', 'video', 'audio', 'document']);

export const sendMessageSchema = z
  .object({
    chatType: chatTypeEnum,
    content: z.string().optional(),
    messageType: messageTypeEnum.default('text'),
    applicationId: z.uuid().optional(),
    fileId: z.uuid().optional(),
    userId: z.uuid().optional(), // for admin initiating direct chat
  })
  .refine(
    (data) => {
      // If fileId is present, content is optional (can be empty or undefined)
      if (data.fileId) return true;
      // If no fileId and messageType is text, content is required and must have length > 0
      if (data.messageType === 'text') return !!data.content && data.content.length > 0;
      return true;
    },
    { message: 'Content required for text messages when no file is attached', path: ['content'] }
  )
  .refine(
    (data) => {
      if (data.chatType === 'application') return !!data.applicationId;
      return true;
    },
    { message: 'applicationId required for application chat', path: ['applicationId'] }
  )
  .refine(
    (data) => {
      if (data.messageType !== 'text') return !!data.fileId;
      return true;
    },
    { message: 'fileId required for non-text messages', path: ['fileId'] }
  );

export const listConversationsSchema = z.object({
  query: z.object({
    chatType: chatTypeEnum.optional(),
    userId: z.uuid().optional(), // for admin filtering direct chats
    applicationId: z.uuid().optional(),
    page: z.coerce.number().int().nonnegative().optional(),
    size: z.coerce.number().int().positive().optional(),
  }),
});

export const listMessagesSchema = z.object({
  query: z.object({
    applicationId: z.uuid().optional(),
    userId: z.uuid().optional(),
    page: z.coerce.number().int().nonnegative().optional(),
    size: z.coerce.number().int().positive().optional(),
  }),
});

export const markReadSchema = z.object({
  body: z
    .object({
      chatType: chatTypeEnum,
      userId: z.uuid().optional(), // required for admin + support chat
      applicationId: z.uuid().optional(), // required for application chat
    })
    .refine(
      (data) => {
        if (data.chatType === 'application') return !!data.applicationId;
        return true;
      },
      { message: 'applicationId required for application chat', path: ['applicationId'] }
    ),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
