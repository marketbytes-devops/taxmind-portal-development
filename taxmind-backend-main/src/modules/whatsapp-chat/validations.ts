import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{1,14}$/;

export const listConversationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().nonnegative().optional(),
    size: z.coerce.number().int().positive().optional(),
    type: z.enum(['registered', 'unregistered']).default('registered').optional(),
  }),
});

export const listMessagesSchema = z.object({
  // phone or userId must be provided
  query: z.object({
    phone: z
      .string()
      .regex(e164Regex, {
        message: 'Phone number must be in international E.164 format (e.g. +14155552671)',
      })
      .optional()
      .nullable(),
    userId: z.uuid().optional().nullable(),
    page: z.coerce.number().int().nonnegative().optional(),
    size: z.coerce.number().int().positive().optional(),
  }),
});

export const markReadSchema = z.object({
  body: z.object({
    userId: z.uuid().optional().nullable(), // required for admin + support chat
    phone: z
      .string()
      .regex(e164Regex, {
        message: 'Phone number must be in international E.164 format (e.g. +14155552671)',
      })
      .optional()
      .nullable(),
  }),
});
export const sendMessageSchema = z.object({
  body: z.object({
    phone: z.string().regex(e164Regex, {
      message: 'Phone number must be in international E.164 format (e.g. +14155552671)',
    }),
    content: z.string().max(4096).trim(),
    mediaId: z.string().optional().nullable(),
    messageType: z.enum(['text', 'image', 'video', 'audio', 'document', 'sticker']).default('text'),
    fileName: z.string().max(255).optional().nullable(),
  }),
});
export const downloadMediaSchema = z.object({
  body: z.object({
    messageId: z.uuid(),
  }),
});
