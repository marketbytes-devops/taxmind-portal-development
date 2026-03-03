import * as bcrypt from 'bcrypt';
import { endOfDay, startOfDay } from 'date-fns';
import { SQL, and, between, eq, gte, ilike, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

import {
  OTP_EXPIRATION_TIME,
  applicationStatuses,
  applicationStatusesArr,
  documentRejectedReasons,
  offlinePaymentStatusesArr,
  paymentMethodsArr,
  paymentStatusesArr,
  policyTypesArr,
} from '@/constants';
import { activityLogEntityNames } from '@/constants';
import { db, models } from '@/database';
import logger from '@/logger';
import { activityLog } from '@/logger/activityLog';
import { mail } from '@/mail';
import ApiError from '@/utils/apiError';
import { generateOTP } from '@/utils/generateOtp';
import { generatePassword } from '@/utils/generatePassword';
import { serviceHandler } from '@/utils/serviceHandler';
import { transformRoleData } from '@/utils/transformRoleData';

import {
  changePasswordSchema,
  emailVerificationCodeSchema,
  getAccessTokenSchema,
  listReportsSchema,
  registerNewUserSchema,
  resetPasswordSchema,
  signInSchema,
  verifyEmailSchema,
} from './validations';

export const signIn = serviceHandler(signInSchema, async (req, res) => {
  const { email, password } = req.body;

  const admin = await db.query.admins.findFirst({
    where: ilike(models.admins.email, email),
    with: {
      role: {
        columns: { id: true, roleName: true },
        with: {
          roleModulePermissions: {
            columns: { id: true },
            where: eq(models.roleModulePermissions.isEnabled, true),
            with: {
              modulePermission: {
                columns: { id: true, permissionName: true, displayName: true, description: true },
                with: {
                  module: {
                    columns: { id: true, name: true, displayName: true, description: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!admin) throw new ApiError('Invalid email or password', 400);
  if (admin.status === false) throw new ApiError('Your account has been suspended', 400);

  const isPasswordMatch = await bcrypt.compare(password, admin.password);
  if (!isPasswordMatch) throw new ApiError('Invalid email or password', 400);

  const accessToken = jwt.sign(
    { id: admin.id, type: 'ADMIN' },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: admin.id, type: 'ADMIN' },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE } as jwt.SignOptions
  );

  // Update refresh token in database
  await db
    .update(models.admins)
    .set({
      accessToken,
      refreshToken,
      lastActivityAt: new Date(),
    })
    .where(eq(models.admins.id, admin.id));

  // Log the activity
  // await activityLogQueue.add(
  //   'log',
  //   {
  //     action: 'admin_login',
  //     metadata: { email },
  //     adminId: admin.id,
  //     ipAddress: req.ip,
  //     userAgent: req.get('User-Agent'),
  //   },
  //   DEFAULT_MQ_REMOVE_CONFIG
  // );

  return res.success('Login successfully.', {
    name: admin.name,
    email: admin.email,
    role: transformRoleData(admin.role),
    accessToken,
    refreshToken,
  });
});

export const listAdminUsers = serviceHandler(async (req, res) => {
  const { keyword } = req.query;
  const { limit, offset, page, size } = req.pagination;

  let filters: (SQL | undefined)[] = [];

  const superAdminRole = await db.query.roles.findFirst({
    where: eq(models.roles.roleName, 'Super Admin'),
    columns: { id: true },
  });

  if (superAdminRole) {
    filters.push(ne(models.admins.roleId, superAdminRole.id));
  }

  if (keyword) {
    filters.push(
      or(ilike(models.admins.name, `%${keyword}%`), ilike(models.admins.email, `%${keyword}%`))
    );
  }

  const [totalAdminUsers, admins] = await Promise.all([
    db.$count(models.admins, and(...filters)),
    db.query.admins.findMany({
      where: and(...filters),
      columns: {
        id: true,
        name: true,
        email: true,
        lastActivityAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      with: { role: { columns: { id: true, roleName: true } } },
      limit,
      offset,
      orderBy: (admin, { desc }) => [desc(admin.createdAt)],
    }),
  ]);

  return res.data('Admin users retrieved successfully', admins, {
    page,
    size,
    total: totalAdminUsers,
  });
});

export const registerNewUser = serviceHandler(registerNewUserSchema, async (req, res) => {
  const { name, email, roleId } = req.body;

  const adminExist = await db.query.admins.findFirst({
    where: ilike(models.admins.email, email),
  });

  if (adminExist) throw new ApiError('An account already exist with this email');

  const role = await db.query.roles.findFirst({
    where: eq(models.roles.id, roleId),
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
  });
  if (!role) return res.error('Invalid role id');

  const password = generatePassword();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [admin] = await db
    .insert(models.admins)
    .values({ name, email, password: hashedPassword, roleId })
    .returning();

  //  EMAIL: send credentials to user email
  await mail.newAdminAccount({
    recipient: email,
    replacements: {
      name: name,
      email,
      password,
      dashboardUrl: process.env.ADMIN_DASHBOARD_BASE_URL,
    },
  });

  // await activityLogQueue.add(
  //   'activityLog',
  //   {
  //     entityName: 'admin',
  //     entityId: admin.id,
  //     action: 'insert',
  //     modifiedUserId: req.user.id,
  //     // oldData: {},
  //     newData: admin,
  //   },
  //   DEFAULT_MQ_REMOVE_CONFIG
  // );
  const activityLogData = {
    entityName: activityLogEntityNames.admin,
    entityId: admin.id,
    action: 'insert' as const,
    modifiedUserId: req.admin.id,
    oldData: null,
    newData: admin,
  };
  await activityLog(activityLogData);
  return res.success(
    'New user added successfully',
    {
      name: admin.name,
      email: admin.email,
      role: transformRoleData(role),
    },
    201
  );
});

export const sendEmailVerificationCode = serviceHandler(
  emailVerificationCodeSchema,
  async (req, res) => {
    const { email } = req.body;

    const admin = await db.query.admins.findFirst({
      where: ilike(models.admins.email, email),
    });
    if (!admin) throw new ApiError('Invalid email');

    if (!admin.status)
      throw new ApiError('Your account has been restricted by the administrator.', 423);

    const otp = generateOTP();
    const otpExpiresIn = new Date(Date.now() + OTP_EXPIRATION_TIME);

    await db
      .update(models.admins)
      .set({ emailOtp: otp, emailOtpExpires: otpExpiresIn })
      .where(eq(models.admins.id, admin.id));

    //  EMAIL: send verification code
    await mail.verifyEmail({ recipient: email, replacements: { otp } });

    return res.success('OTP is send to your email', {
      name: admin.name,
      email: admin.email,
    });
  }
);

export const verifyEmailOtp = serviceHandler(verifyEmailSchema, async (req, res) => {
  const { email, otp } = req.body;

  const admin = await db.query.admins.findFirst({
    where: and(
      ilike(models.admins.email, email),
      eq(models.admins.emailOtp, otp),
      gte(models.admins.emailOtpExpires, new Date())
    ),
  });

  if (!admin) return res.error('OTP expires or invalid');

  if (!admin.status)
    throw new ApiError('Your account has been restricted by the administrator.', 423);

  await db
    .update(models.admins)
    .set({ isEmailOtpVerified: true, emailVerifiedAt: new Date() })
    .where(eq(models.admins.id, admin.id));

  return res.success('OTP verified', {
    name: admin.name,
    email: admin.email,
  });
});

export const changePassword = serviceHandler(changePasswordSchema, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (req.admin.password) {
    if (!currentPassword) return res.error('Current password is required');

    const isValid = await bcrypt.compare(currentPassword, req.admin.password);
    if (!isValid) throw new ApiError('Current password is invalid');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const accessToken = jwt.sign(
    { id: req.admin.id, type: 'ADMIN' },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: req.admin.id, type: 'ADMIN' },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE } as jwt.SignOptions
  );

  await db
    .update(models.admins)
    .set({ password: hashedPassword, accessToken, refreshToken })
    .where(eq(models.admins.id, req.admin.id));

  return res.success('Password changed successfully', {
    name: req.admin.name,
    email: req.admin.email,
    role: req.admin.role,
    accessToken,
    refreshToken,
  });
});

export const resetPassword = serviceHandler(resetPasswordSchema, async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const admin = await db.query.admins.findFirst({
    where: and(ilike(models.admins.email, email), eq(models.admins.emailOtp, otp)),
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
  });

  if (!admin) return res.error('Invalid OTP');

  // Ensure the OTP was verified before allowing password reset
  if (!admin.isEmailOtpVerified) return res.error('OTP not verified. Please verify OTP first.');

  // Hash and update the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const accessToken = jwt.sign(
    { id: req.admin.id, type: 'ADMIN' },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: req.admin.id, type: 'ADMIN' },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE } as jwt.SignOptions
  );

  // Clear the OTP and its expiration after successful password reset
  // Add new passowrd, access and refresh tokens
  await db
    .update(models.admins)
    .set({
      password: hashedPassword,
      accessToken,
      refreshToken,
      emailOtp: null,
      emailOtpExpires: null,
      isEmailOtpVerified: false,
    })
    .where(eq(models.admins.id, admin.id));

  return res.success('Password reset successfully.', {
    name: admin.name,
    email: admin.email,
    role: transformRoleData(admin.role),
    accessToken,
    refreshToken,
  });
});

export const signOut = serviceHandler(async (req, res) => {
  await db
    .update(models.admins)
    .set({
      accessToken: null,
      refreshToken: null,
      emailOtp: null,
      emailOtpExpires: null,
      isEmailOtpVerified: false,
    })
    .where(eq(models.admins.id, req.admin.id));
  return res.success('Logout Successfully');
});

export const refreshToken = serviceHandler(getAccessTokenSchema, async (req, res) => {
  const { email } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) throw new ApiError('Unauthorized', 401);

  const refreshToken = authHeader.split(' ')[1];
  if (!refreshToken) throw new ApiError('Unauthorized', 401);

  const admin = await db.query.admins.findFirst({
    where: ilike(models.admins.email, email),
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
  });

  if (!admin) throw new ApiError('Unauthorized', 401);

  if (admin.refreshToken !== refreshToken) throw new ApiError('Unauthorized', 401);

  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.error((error as Error).message);
    throw new ApiError('Unauthorized', 401);
  }

  if (admin && !admin.status)
    throw new ApiError('Your account has been blocked by administrator.', 423);

  const accessToken = jwt.sign(
    { id: admin.id, type: 'ADMIN' },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE } as jwt.SignOptions
  );

  await db.update(models.admins).set({ accessToken }).where(eq(models.admins.id, admin.id));

  return res.success('Access token refreshed successfully', {
    name: admin.name,
    email: admin.email,
    role: transformRoleData(admin.role),
    accessToken,
    refreshToken: admin.refreshToken,
  });
});

export const getAdminProfile = serviceHandler(async (req, res) => {
  const { id, name, email, createdAt, updatedAt, role } = req.admin;

  return res.success('Admin profile retrieved successfully', {
    id,
    name,
    email,
    createdAt,
    updatedAt,
    role,
  });
});

export const updateAdminProfile = serviceHandler(async (req, res) => {
  const { adminId } = req.params;
  const { name, status, roleId } = req.body;

  // Check if admin being updated exists
  const adminToUpdate = await db.query.admins.findFirst({
    where: eq(models.admins.id, adminId),
    with: {
      role: true,
    },
  });

  if (!adminToUpdate) return res.notFound('Admin');

  // Prevent updating the super admin account (if it's the only super admin)
  if (adminToUpdate.role?.roleName === 'Super Admin') {
    const superAdminCount = await db.$count(
      models.admins,
      and(eq(models.admins.status, true), eq(models.admins.roleId, adminToUpdate.roleId))
    );

    if (superAdminCount === 1) {
      return res.error('Cannot modify the Super Admin account');
    }
  }

  const isNullish = Object.values({ name, status, roleId }).every((value) => {
    return !!(value === null || value === undefined || value === '');
  });
  if (isNullish) return res.error('Unable to update admin profile. Received empty data');

  if (roleId) {
    const roleExist = await db.query.roles.findFirst({ where: eq(models.roles.id, roleId) });
    if (!roleExist) return res.notFound('Role');
  }

  const [updatedAdmin] = await db
    .update(models.admins)
    .set({ name, status, roleId })
    .where(eq(models.admins.id, adminId))
    .returning();
  const activityLogData = {
    entityName: activityLogEntityNames.admin,
    entityId: adminId,
    action: 'update' as const,
    modifiedUserId: req.admin.id,
    oldData: adminToUpdate,
    newData: updatedAdmin,
  };
  await activityLog(activityLogData);
  return res.success('Profile updated successfully');
});

export const adminLookup = serviceHandler(async (req, res) => {
  let appStatuses = applicationStatusesArr.filter((status) => status !== applicationStatuses.DRAFT);
  const data = {
    applicationStatuses: appStatuses,
    paymentMethods: paymentMethodsArr,
    paymentStatuses: paymentStatusesArr,
    offlinePaymentStatuses: offlinePaymentStatusesArr,
    documentRejectedReasons,
    policyTypes: policyTypesArr,
  };

  return res.success('Admin dropdown data retrieved successfully', data);
});

export const getAdminDashboard = serviceHandler(async (req, res) => {
  const pendingPaymentStatus = 'pending';
  const [
    approvedApplications,
    submittedApplications,
    activeUsers,
    approvedReviews,
    pendingReviews,
    pendingUsers,
    paymentsPending,
    agentActivation,
    toBeFiled,
    unRegisteredCustomers,
  ] = await Promise.all([
    // Applications that completed refund process
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.REFUND_COMPLETED)
      )
    ),
    // Applications submitted by users (awaiting documents upload/review)
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.SUBMITTED)
      )
    ),
    // Active users
    db.$count(
      models.users,
      and(
        isNull(models.users.deletedAt),
        eq(models.users.status, true),
        isNotNull(models.users.emailVerifiedAt),
        isNotNull(models.users.phoneVerifiedAt),
        eq(models.users.isSignatureConsentCompleted, true)
      )
    ),
    // Applications that have been reviewed
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.DOCUMENTS_VERIFIED)
      )
    ),
    // Applications pending review (documents uploaded but not reviewed)
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.DOCUMENTS_UPLOADED)
      )
    ),
    // Users pending activation (disabled)
    db.$count(
      models.users,
      and(
        isNull(models.users.deletedAt),
        or(
          isNull(models.users.emailVerifiedAt),
          isNull(models.users.phoneVerifiedAt),
          eq(models.users.isSignatureConsentCompleted, false)
        )
      )
    ),
    // Payments with pending status
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.REFUND_COMPLETED),
        eq(models.applications.paymentStatus, pendingPaymentStatus)
      )
    ),
    // Users awaiting tax agent activation (not completed)
    db.$count(
      models.users,
      and(isNull(models.users.deletedAt), eq(models.users.isTaxAgentVerificationCompleted, false))
    ),
    // Applications in processing (to be filed)
    db.$count(
      models.applications,
      and(
        isNull(models.applications.deletedAt),
        eq(models.applications.status, applicationStatuses.PROCESSING)
      )
    ),
    // Count distinct unregistered users in whatsapp chat table
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${models.whatsappChats.hashedPhone})` })
      .from(models.whatsappChats)
      .where(
        and(isNull(models.whatsappChats.deletedAt), eq(models.whatsappChats.isRegistered, false))
      )
      .then((result) => result[0]?.count || 0),
  ]);

  return res.success('Admin dashboard data retrieved successfully', {
    approvedApplications,
    submittedApplications,
    activeUsers,
    approvedReviews,
    pendingReviews,
    pendingUsers,
    paymentsPending,
    agentActivation,
    toBeFiled,
    unRegisteredCustomers,
  });
});

export const listReports = serviceHandler(listReportsSchema, async (req, res) => {
  const { limit, offset, page, size } = req.pagination;
  const { keyword, startDate, endDate } = req.query;

  let filters: (SQL | undefined)[] = [];

  if (keyword) {
    filters.push(
      or(ilike(models.users.name, `%${keyword}%`), ilike(models.users.email, `%${keyword}%`))
    );
  }

  if (startDate && endDate) {
    filters.push(between(models.users.createdAt, startOfDay(startDate), endOfDay(endDate)));
  } else if (startDate) {
    filters.push(between(models.users.createdAt, startOfDay(startDate), endOfDay(new Date())));
  } else if (endDate) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    filters.push(
      between(models.users.createdAt, startOfDay(fromDate), endOfDay(new Date(endDate)))
    );
  } else {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    filters.push(between(models.users.createdAt, startOfDay(fromDate), endOfDay(new Date())));
  }

  const [totalUsers, users] = await Promise.all([
    db.$count(models.users, and(...filters)),
    db.query.users.findMany({
      where: and(...filters),
      columns: {
        id: true,
        name: true,
        email: true,
        dob: true,
        createdAt: true,
      },
      limit,
      offset,
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    }),
  ]);

  return res.data('User reports retrieved successfully', users, { page, size, total: totalUsers });
});
