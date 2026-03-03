import { z } from 'zod';

import { notificationTypesArr } from '@/constants';

export const listNotificationSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().nonnegative().optional(),
      size: z.coerce.number().int().nonnegative().optional(),
      notificationType: z.enum(notificationTypesArr as TPgEnum).optional(),
    })
    .strict(),
});

export const updateFcmTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string({ message: 'fcm token is required' }),
  }),
});

export const removeFcmTokenSchema = z.object({
  body: z.object({
    fcmToken: z.string({ message: 'fcm token is required' }),
  }),
});
