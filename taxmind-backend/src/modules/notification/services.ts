import { SQL, and, eq, gt, inArray, isNull, sql } from 'drizzle-orm';

import { db, models } from '@/database';
import { sendNotification as sendPushNotification, verifyFcmToken } from '@/integrations/firbase';
import { serviceHandler } from '@/utils/serviceHandler';
import { updateStringList } from '@/utils/updateStringList';

import { listNotificationSchema, removeFcmTokenSchema, updateFcmTokenSchema } from './validations';

export const sendNotification = serviceHandler(async (req, res) => {
  const { title, message, notificationType, fcmToken } = req.body;

  //   NOTIFICATION: send broadcast notification to users
  // await notificationQueue.add(
  //   'sendNotification',
  //   {
  //     payload: { title, body: message, type: notificationType },
  //     userId: req.admin.id,
  //     topic: notificationTypes.broadcast.key,
  //     data: { type: notificationTypes.broadcast.key, meta: notificationTypes.broadcast.meta },
  //     isAdminNotification: true,
  //   },
  //   DEFAULT_MQ_REMOVE_CONFIG
  // );

  await verifyFcmToken(fcmToken);
  await sendPushNotification({
    tokens: [fcmToken],
    payload: { title, body: message },
    data: { type: notificationType },
  });

  return res.success(
    'Notification sent successfully',
    {
      title,
      message,
      notificationType,
      createdAt: new Date(),
    },
    201
  );
});

export const listAdminSendNotifications = serviceHandler(
  listNotificationSchema,
  async (req, res) => {
    const { limit, offset, page, size } = req.pagination;
    const { notificationType } = req.query;

    let filters: (SQL | undefined)[] = [];

    if (notificationType) {
      filters.push(eq(models.notifications.notificationType, notificationType));
    }

    const [totalNotifications, notifications] = await Promise.all([
      db.$count(models.notifications, and(...filters)),
      db.query.notifications.findMany({
        where: and(...filters),
        limit,
        offset,
        orderBy: (notification, { desc }) => [desc(notification.createdAt)],
      }),
    ]);

    return res.data('Admin notifications retrieved successfully', notifications, {
      page,
      size,
      total: totalNotifications,
    });
  }
);

export const listUserNotifications = serviceHandler(async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const filter = inArray(
    models.notifications.id,
    sql`(SELECT "user_notifications"."notification_id" FROM "user_notifications" WHERE "user_notifications"."user_id" = ${req.user.id})`
  );

  const [totalNotifications, userNotifications] = await Promise.all([
    db.$count(
      models.notifications,
      and(gt(models.notifications.createdAt, req.user.createdAt), filter)
    ),
    db.query.notifications.findMany({
      where: and(gt(models.notifications.createdAt, req.user.createdAt), filter),
      extras: {
        isNotificationSeen:
          sql`(SELECT EXISTS(SELECT 1 FROM "user_notifications" WHERE "user_notifications"."notification_id" = ${models.notifications.id} AND "user_notifications"."read_at" IS NOT NULL LIMIT 1))`.as(
            'isNotificationSeen'
          ),
      },
      orderBy: (notification, { desc }) => [desc(notification.createdAt)],
      limit,
      offset,
    }),
  ]);

  const formattedNotifications = userNotifications.map((notification) => {
    const { id, title, message, data, notificationType, createdAt, isNotificationSeen } =
      notification;

    return { id, title, message, data, notificationType, createdAt, isNotificationSeen };
  });

  return res.data('User notifications retrieved successfully', formattedNotifications, {
    page,
    size,
    total: totalNotifications,
  });
});

export const updateUserFcmToken = serviceHandler(updateFcmTokenSchema, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.error('fcmToken is required');

  const decodedToken = await verifyFcmToken(fcmToken);
  if (!decodedToken) return res.error('Unable to verify fcm token');

  // console.log(true, { fcmToken });

  const updatedTokens = updateStringList(req.user.fcmToken, fcmToken);

  // const subscribeToUserTopics =
  //   req.user.subscribedFcmTopics && req.user.isAppNotificationEnabled
  //     ? req.user.subscribedFcmTopics
  //         ?.split(',')
  //         .map((topic) => subscribeToTopic(updatedTokens.split(','), topic))
  //     : [];

  const [updatedUser] = await Promise.all([
    db
      .update(models.users)
      .set({ fcmToken: updatedTokens })
      .where(eq(models.users.id, req.user.id))
      .returning({ id: models.users.id, name: models.users.name }),
    // ...subscribeToUserTopics,
  ]);

  return res.success('User fcm token updated successfully', updatedUser);
});

export const removeUserFcmToken = serviceHandler(removeFcmTokenSchema, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.error('fcmToken is required');

  const currentTokens = req.user.fcmToken ? req.user.fcmToken.split(',') : [];
  const updatedTokens = currentTokens.filter((token) => token !== fcmToken).join(',');
  const [updatedUser] = await db
    .update(models.users)
    .set({ fcmToken: updatedTokens || null })
    .where(eq(models.users.id, req.user.id))
    .returning({ id: models.users.id, name: models.users.name });

  return res.success('User fcm token removed successfully', updatedUser);
});

export const markNotificationAsSeen = serviceHandler(async (req, res) => {
  await db
    .update(models.userNotifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(models.userNotifications.userId, req.user.id), isNull(models.userNotifications.readAt))
    );

  return res.success('Notifications marked as read');
});



export const listAdminNotifications = serviceHandler(async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  const filter = inArray(
    models.notifications.id,
    sql`(SELECT "admin_notifications"."notification_id" FROM "admin_notifications" WHERE "admin_notifications"."admin_id" = ${req.admin.id})`
  );

  const [totalNotifications, adminNotifications] = await Promise.all([
    db.$count(
      models.notifications,
      and(gt(models.notifications.createdAt, req.admin.createdAt), filter)
    ),
    db.query.notifications.findMany({
      where: and(gt(models.notifications.createdAt, req.admin.createdAt), filter),
      extras: {
        isNotificationSeen:
          sql`(SELECT EXISTS(SELECT 1 FROM "admin_notifications" WHERE "admin_notifications"."notification_id" = ${models.notifications.id} AND "admin_notifications"."read_at" IS NOT NULL LIMIT 1))`.as(
            'isNotificationSeen'
          ),
      },
      orderBy: (notification, { desc }) => [desc(notification.createdAt)],
      limit,
      offset,
    }),
  ]);

  const formattedNotifications = adminNotifications.map((notification) => {
    const { id, title, message, data, notificationType, createdAt, isNotificationSeen } =
      notification;

    return { id, title, message, data, notificationType, createdAt, isNotificationSeen };
  });

  return res.data('Admin notifications retrieved successfully', formattedNotifications, {
    page,
    size,
    total: totalNotifications,
  });
});

export const updateAdminFcmToken = serviceHandler(updateFcmTokenSchema, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.error('fcmToken is required');

  // const decodedToken = await verifyFcmToken(fcmToken);
  // if (!decodedToken) return res.error('Unable to verify fcm token');

  // console.log(true, { fcmToken });

  const updatedTokens = updateStringList(req.admin.fcmToken, fcmToken);

  // const subscribeToUserTopics =
  //   req.user.subscribedFcmTopics && req.user.isAppNotificationEnabled
  //     ? req.user.subscribedFcmTopics
  //         ?.split(',')
  //         .map((topic) => subscribeToTopic(updatedTokens.split(','), topic))
  //     : [];

  const [updatedAdmin] = await Promise.all([
    db
      .update(models.admins)
      .set({ fcmToken: updatedTokens })
      .where(eq(models.admins.id, req.admin.id))
      .returning({ id: models.admins.id, name: models.admins.name }),
    // ...subscribeToUserTopics,
  ]);

  return res.success('Admin fcm token updated successfully', updatedAdmin);
});

export const removeAdminFcmToken = serviceHandler(removeFcmTokenSchema, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.error('fcmToken is required');

  const currentTokens = req.admin.fcmToken ? req.admin.fcmToken.split(',') : [];
  const updatedTokens = currentTokens.filter((token) => token !== fcmToken).join(',');
  const [updatedAdmin] = await db
    .update(models.admins)
    .set({ fcmToken: updatedTokens || null })
    .where(eq(models.admins.id, req.admin.id))
    .returning({ id: models.admins.id, name: models.admins.name });

  return res.success('Admin fcm token removed successfully', updatedAdmin);
});

export const markAdminNotificationAsSeen = serviceHandler(async (req, res) => {
  await db
    .update(models.adminNotifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(models.adminNotifications.adminId, req.admin.id), isNull(models.adminNotifications.readAt))
    );

  return res.success('Notifications marked as read');
});