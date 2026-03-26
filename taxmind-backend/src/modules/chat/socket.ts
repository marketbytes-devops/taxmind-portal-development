import { and, eq, isNull } from 'drizzle-orm';
import http from 'http';
import { Server } from 'socket.io';
import { ZodError } from 'zod';
import { fromError } from 'zod-validation-error';

import { db, models } from '@/database';
import logger from '@/logger';
import { decodeJwt, loadUserByRole } from '@/middleware/authorize/helper';
import { createChatMessage } from '@/modules/chat/services';
import { adminNotificationHandler, notificationHandler } from '@/notifications';
import { notificationTemplates } from '@/notifications/templates';
import { AdminWithRole, User } from '@/types';
import ApiError from '@/utils/apiError';
import { prettifyZodMessage } from '@/utils/prettifyZodMessage';

import { sendMessageSchema } from './validations';

interface SocketAuthPayload {
  token?: string;
}

interface Request {
  headers: { authorization: string };
  user: User | null;
  admin: AdminWithRole | null;
}

// Admin permission cache
type AdminCache = Array<{ id: string; fcmToken: string | null }>;
const adminCaches = new Map<string, { data: AdminCache; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cleanup stale caches every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, cache] of adminCaches.entries()) {
    if (now - cache.timestamp > CACHE_TTL * 2) {
      adminCaches.delete(key);
      logger.debug(`Cleaned up stale admin cache: ${key}`);
    }
  }
}, 10 * 60 * 1000);

async function getAdminsWithModulePermission(moduleName: string): Promise<AdminCache> {
  const now = Date.now();
  const cached = adminCaches.get(moduleName);

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const admins = await db
      .selectDistinct({
        id: models.admins.id,
        fcmToken: models.admins.fcmToken,
      })
      .from(models.admins)
      .innerJoin(models.roles, eq(models.admins.roleId, models.roles.id))
      .innerJoin(
        models.roleModulePermissions,
        eq(models.roles.id, models.roleModulePermissions.roleId)
      )
      .innerJoin(
        models.modulePermissions,
        eq(models.roleModulePermissions.modulePermissionId, models.modulePermissions.id)
      )
      .innerJoin(models.modules, eq(models.modulePermissions.moduleId, models.modules.id))
      .where(
        and(
          eq(models.admins.status, true),
          eq(models.roleModulePermissions.isEnabled, true),
          eq(models.modules.name, moduleName)
        )
      );

    adminCaches.set(moduleName, { data: admins, timestamp: now });
    return admins;
  } catch (error) {
    logger.error(`Failed to fetch admins with ${moduleName} permissions`, { error });
    // Return stale cache if available
    if (cached?.data.length) {
      logger.warn(`Using stale ${moduleName} admin cache due to query failure`);
      return cached.data;
    }
    return [];
  }
}

const getAdminsWithCustomerSupport = () => getAdminsWithModulePermission('customer_support');
const getAdminsWithApplicationPermission = () => getAdminsWithModulePermission('applications');

// Helper to send admin notifications asynchronously
async function sendAdminNotifications(
  applicationId: string | undefined,
  applicationNo: string | null | undefined,
  userName: string,
  messageId: string,
  userId: string
): Promise<void> {
  const admins = applicationId
    ? await getAdminsWithApplicationPermission()
    : await getAdminsWithCustomerSupport();

  if (!admins.length) return;

  const adminFcmTokens = admins
    .flatMap((admin) => admin.fcmToken?.split(',') || [])
    .filter((token): token is string => !!token && token.trim().length > 0);

  const template = applicationId
    ? notificationTemplates.applicationSupportMessageReceived
    : notificationTemplates.customerSupportMessageReceived;

  const body = applicationId
    ? template.body
        .replace('USER_NAME', userName)
        .replace('APP_NO', applicationNo || 'an application')
    : template.body.replace('USER_NAME', userName);

  await adminNotificationHandler({
    tokens: adminFcmTokens.length > 0 ? adminFcmTokens : undefined,
    payload: {
      title: template.title,
      body,
      type: template.type,
    },
    data: {
      type: template.type,
      messageId,
      userId,
    },
    adminIds: admins.map((admin) => admin.id),
  });
}
async function sendUserNotification(
  user: {
    id: string;
    fcmToken: string | null;
    isAppNotificationEnabled: boolean;
  },
  messageId: string,
  userId: string,
  applicationId: string | null | undefined,
  applicationNo: string | null | undefined
): Promise<void> {
  const template = applicationId
    ? notificationTemplates.applicationSupportMessageReceived
    : notificationTemplates.customerSupportMessageReceived;
  const body = applicationId
    ? template.body
        .replace('USER_NAME', 'Taxmind Admin')
        .replace('APP_NO', applicationNo || 'an application')
    : template.body.replace('USER_NAME', 'Taxmind Admin');
  await notificationHandler({
    tokens: user.fcmToken?.split(','),
    payload: {
      title: template.title,
      body,
      type: template.type,
    },
    data: {
      type: template.type,
      messageId,
      userId,
    },
    userId: user.id,
    appNotificationsEnabled: user.isAppNotificationEnabled,
  });
}

export const initSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['*'],
      credentials: true,
      allowedHeaders: ['*'],
    },
  });

  const ADMIN_ROOM = 'admins';

  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth as SocketAuthPayload;
      if (!token) return next(new Error('Unauthorized'));

      const authToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
      if (!authToken) return next(new Error('Unauthorized'));

      const decoded = decodeJwt(authToken) as TokenPayload;
      if (!decoded?.type) return next(new Error('Unauthorized'));

      const req: Request = { headers: { authorization: token }, user: null, admin: null };
      await loadUserByRole(decoded.type, decoded, req as unknown as import('express').Request);

      socket.data.user = req.user;
      socket.data.admin = req.admin;

      if (req.admin?.id) {
        socket.join(ADMIN_ROOM);
        logger.debug(`Admin ${req.admin.id} joined socket`);
      } else if (req.user?.id) {
        socket.join(`user:${req.user.id}`);
        logger.debug(`User ${req.user.id} joined socket`);
      }
      next();
    } catch (error) {
      logger.error('Socket authentication failed', { error });
      next(error as Error);
    }
  });

  io.on('connection', (socket) => {
    logger.info(`socket connected ${socket.id}`);

    socket.on('chat:send', async (payload, cb) => {
      try {
        sendMessageSchema.parse(payload);

        const isAdmin = !!socket.data.admin;
        const senderType = isAdmin ? 'admin' : 'user';
        const {
          chatType,
          content = '',
          messageType = 'text',
          applicationId,
          fileId,
          userId,
        } = payload || {};

        if (messageType !== 'text' && !fileId) throw new ApiError('fileId required', 400);

        if (isAdmin && !userId) throw new ApiError('userId required for admin', 400);

        const targetUserId = senderType === 'user' ? socket.data.user.id : userId;

        // Run all validations in parallel
        const [targetUser, application, file] = await Promise.all([
          db.query.users.findFirst({
            where: and(eq(models.users.id, targetUserId), isNull(models.users.deletedAt)),
            columns: { id: true, name: true, fcmToken: true, isAppNotificationEnabled: true },
          }),
          applicationId
            ? db.query.applications.findFirst({
                where: and(
                  eq(models.applications.id, applicationId),
                  isNull(models.applications.deletedAt)
                ),
                columns: { id: true, userId: true, applicationNo: true },
              })
            : Promise.resolve(null),
          fileId
            ? db.query.files.findFirst({
                where: and(eq(models.files.id, fileId), eq(models.files.status, 'active')),
                columns: { id: true },
              })
            : Promise.resolve(null),
        ]);

        if (!targetUser) throw new ApiError('User not found', 404);
        if (applicationId && !application) throw new ApiError('Application not found', 404);
        if (
          applicationId &&
          application &&
          !isAdmin &&
          application.userId !== socket.data.user.id
        ) {
          throw new ApiError('You do not own this application', 403);
        }
        if (fileId && !file) throw new ApiError('File not found or not active', 404);

        const message = await createChatMessage({
          chatType,
          content,
          messageType,
          applicationId,
          fileId,
          userId: targetUserId,
          adminId: isAdmin ? socket.data.admin.id : null,
          senderType,
        });

        // Emit to receiver(s)
        if (senderType === 'user') {
          io.in(ADMIN_ROOM).emit('chat:message', message);
          // Send admin notifications asynchronously (non-blocking)
          sendAdminNotifications(
            applicationId,
            application?.applicationNo || null,
            targetUser.name,
            message.id,
            socket.data.user.id
          ).catch((error: Error) => logger.error('Failed to send admin notifications', { error }));
        } else {
          io.to(`user:${targetUserId}`).emit('chat:message', message);

          sendUserNotification(
            {
              id: targetUser.id,
              fcmToken: targetUser.fcmToken,
              isAppNotificationEnabled: targetUser.isAppNotificationEnabled ?? true,
            },
            message.id,
            targetUserId,
            applicationId,
            application?.applicationNo || null
          ).catch((error: Error) => logger.error('Failed to send user notification', { error }));
        }
        cb?.({ success: true, message });
      } catch (err) {
        let errorMsg: string;
        if (err instanceof ZodError) {
          const validationError = fromError(err, {
            includePath: true,
            maxIssuesInMessage: 1,
          });
          const raw =
            typeof validationError.toString === 'function'
              ? validationError.toString()
              : String(
                  (validationError as unknown as { message?: string }).message || validationError
                );
          errorMsg = prettifyZodMessage(raw);
        } else {
          errorMsg = (err as Error).message || 'Unknown error occurred';
        }
        logger.error('Chat message error', { error: err, socketId: socket.id });
        cb?.({ success: false, error: errorMsg });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected`, { socketId: socket.id });
    });
  });

  return io;
};

export type SocketServer = ReturnType<typeof initSocket>;
