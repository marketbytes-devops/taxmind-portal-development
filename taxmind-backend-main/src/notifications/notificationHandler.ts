import { notificationTypesArr } from '@/constants';
import { db, models } from '@/database';
import { sendNotification } from '@/integrations/firbase';
import { formatTemplate } from '@/utils/formatTemplate';

type TNotification = {
  title: string;
  body: string;
  type: (typeof notificationTypesArr)[number];
};

type TNotificationHandler = {
  payload: TNotification;
  userId: string;
  tokens?: string[] | null;
  topic?: string;
  replacements?: { [x: string]: unknown };
  data?: { [key: string]: unknown };
  // isBulk?: boolean;
  appNotificationsEnabled: boolean | null;
  // isAdminNotification?: boolean;
};

type TAdminNotificationHandler = {
  payload: TNotification;
  adminIds: string[];
  tokens?: string[] | null;
  topic?: string;
  replacements?: { [x: string]: unknown };
  data?: { [key: string]: unknown };
};

export const notificationHandler = async ({
  payload,
  userId,
  tokens,
  topic,
  replacements,
  data,
  // isBulk = false,
  appNotificationsEnabled,
  // isAdminNotification = false,
}: TNotificationHandler) => {
  try {
    const { title, body, type } = payload;

    const notificationPayload = replacements
      ? {
          title: formatTemplate(title, replacements),
          body: formatTemplate(body, replacements),
        }
      : { title, body };

    // console.log(notificationPayload);
    // console.log({ data });

    await db.transaction(async (tx) => {
      const [notification] = await tx
        .insert(models.notifications)
        .values({
          title: notificationPayload.title,
          message: notificationPayload.body,
          notificationType: type,
          data,
        })
        .returning();

      await tx
        .insert(models.userNotifications)
        .values({ notificationId: notification.id, userId: userId });
    });

    if (appNotificationsEnabled)
      await sendNotification({
        topic,
        tokens,
        payload: {
          imageUrl: 'https://taxmind-assets.s3.eu-west-1.amazonaws.com/taxmind-logo.png',
          ...notificationPayload,
        },
        data: { ...data, type },
      });
  } catch (error) {
    console.error(error);
    console.error('Failed to send push notification');
  }
};

export const adminNotificationHandler = async ({
  payload,
  adminIds,
  tokens,
  topic,
  replacements,
  data,
}: TAdminNotificationHandler) => {
  try {
    const { title, body, type } = payload;

    const notificationPayload = replacements
      ? {
          title: formatTemplate(title, replacements),
          body: formatTemplate(body, replacements),
        }
      : { title, body };

    await db.transaction(async (tx) => {
      // Create single notification
      const [notification] = await tx
        .insert(models.notifications)
        .values({
          title: notificationPayload.title,
          message: notificationPayload.body,
          notificationType: type,
          data,
        })
        .returning();

      // Create admin notification records for all admins
      const adminNotificationValues = adminIds.map((adminId) => ({
        notificationId: notification.id,
        adminId: adminId,
      }));

      if (adminNotificationValues.length > 0) {
        await tx.insert(models.adminNotifications).values(adminNotificationValues);
      }
    });

    // Send push notifications to admins
    if (tokens && tokens.length > 0) {
      await sendNotification({
        topic,
        tokens,
        payload: {
          imageUrl: 'https://taxmind-assets.s3.eu-west-1.amazonaws.com/taxmind-logo.png',
          ...notificationPayload,
        },
        data: { ...data, type },
      });
    }
  } catch (error) {
    console.error(error);
    console.error('Failed to send admin push notification');
  }
};
