import { and, eq, isNull } from 'drizzle-orm';
import { Request } from 'express';

import { db, models } from '@/database';
import ApiError from '@/utils/apiError';
import { transformRoleData } from '@/utils/transformRoleData';

export const getUser = async (decoded: TokenPayload, req: Request) => {
  const user = await db.query.users.findFirst({
    where: and(eq(models.users.id, decoded.id), isNull(models.users.deletedAt)),
  });

  if (!user) throw new ApiError('Unauthorized', 401);

  await db
    .update(models.users)
    .set({ lastActivityAt: new Date().toISOString() })
    .where(eq(models.users.id, decoded.id));

  if (!user.status) throw new ApiError('Your account has been blocked by administrator.', 498);

  req.user = { ...user, profilePhoto: null };
};

export const getAdmin = async (decoded: TokenPayload, req: Request) => {
  const [admin] = await Promise.all([
    db.query.admins.findFirst({
      where: eq(models.admins.id, decoded.id),
      with: {
        role: {
          columns: { id: true, roleName: true },
          with: {
            roleModulePermissions: {
              where: eq(models.roleModulePermissions.isEnabled, true),
              with: {
                modulePermission: {
                  with: {
                    module: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db
      .update(models.admins)
      .set({ lastActivityAt: new Date() })
      .where(eq(models.admins.id, decoded.id)),
  ]);

  if (!admin) throw new ApiError('Unauthorized', 401);

  if (!admin.status) throw new ApiError('Your account has been blocked by administrator.', 498);

  console.log('Admin access token:', admin.accessToken);
  console.log('Request authorization header:', req.headers.authorization);
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : req.headers.authorization;

  if (!admin.accessToken || admin.accessToken !== token) {
    throw new ApiError('Invalid access token', 498);
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const { role, ...rest } = admin;

  const adminRole = transformRoleData(admin.role);

  req.admin = { ...rest, role: adminRole };
};
