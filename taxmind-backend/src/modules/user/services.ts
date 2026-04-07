import * as bcrypt from 'bcrypt';
import { endOfDay, startOfDay } from 'date-fns';
import {
  SQL,
  and,
  between,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  ne,
  not,
  or,
  sql,
} from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

import { OTP_EXPIRATION_TIME, activityLogEntityNames, notificationTypes, policyTypes } from '@/constants';
import { db, models } from '@/database';
import {
  checkVerification as twilioCheckVerification,
  verifyPhone as twilioVerifyPhone,
} from '@/integrations/twilio';
import { sendSignatureRequest } from '@/integrations/zohoSign';
import logger from '@/logger';
import { activityLog } from '@/logger/activityLog';
import { mail } from '@/mail';
import { adminNotificationHandler, notificationHandler } from '@/notifications';
import { notificationTemplates } from '@/notifications/templates/index';
import ApiError from '@/utils/apiError';
import { hashSearchKeyword, hashTrigrams, hashWithHMAC } from '@/utils/crypto';
import { generateOTP } from '@/utils/generateOtp';
import { serviceHandler } from '@/utils/serviceHandler';

import {
  agentActivationUploadSchema,
  changePasswordSchema,
  emailVerificationCodeSchema,
  getAccessTokenSchema,
  getUserDetailsSchema,
  idParamSchema,
  listAgentActivationSchema,
  listQueriesSchema,
  listUserSchema,
  offBoardedUsersListSchema,
  pairUserSchema,
  phoneVerificationCodeSchema,
  reactivateAccountSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  submitQuerySchema,
  unbindSpouseSchema,
  unpairUserSchema,
  updateActivationStatusSchema,
  updateProfileSchema,
  updateUserRemarkSchema,
  searchProfessionSchema,
  userIdBodySchema,
  verifyEmailSchema,
  verifyPhoneSchema,
} from './validations';

// Helper function to convert OTP to string for encrypted storage
const otpToString = (otp: number): string => otp.toString();

// Helper function to convert Date to ISO string for encrypted storage
const dateToString = (date: Date): string => date.toISOString();

export const signUp = serviceHandler(signUpSchema, async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    dob,
    profession,
    ppsNo,
    address,
    eircode,
    maritalStatus,
    spouse,
  } = req.body;

  const isProduction = process.env.NODE_ENV === 'production';

  // Generate trigram hashes for searching
  const emailTrigramHashes = hashTrigrams(email.toLowerCase());
  const phoneTrigramHashes = hashTrigrams(phone);
  const ppsNumberTrigramHashes = hashTrigrams(ppsNo);
  const nameTrigramHashes = hashTrigrams(name.toLowerCase());
  const professionTrigramHashes = hashTrigrams(profession.toLowerCase());

  type UserInsert = typeof models.users.$inferInsert;
  type UserSelect = typeof models.users.$inferSelect;
  let spouseExist: UserSelect | undefined;

  const sEmailTrigramHashes = spouse ? hashTrigrams(spouse.email.toLowerCase()) : null;
  const sPhoneTrigramHashes = spouse ? hashTrigrams(spouse.phone) : null;
  const sPpsTrigramHashes = spouse ? hashTrigrams(spouse.ppsNo) : null;
  const sNameTrigramHashes = spouse ? hashTrigrams(spouse.name.toLowerCase()) : null;
  const sProfessionTrigramHashes = spouse ? hashTrigrams(spouse.profession.toLowerCase()) : null;

  // Check if user exists by EXACT matching - must match ALL trigrams
  // Using @> (contains) operator ensures we only find users with EXACT same email/phone/pps
  // This prevents duplicate accounts - critical for signup validation
  const userExist = await db.query.users.findFirst({
    where: and(
      or(
        sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
          emailTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
          emailTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[]`,
        sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
          phoneTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
          phoneTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[]`,
        sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
          ppsNumberTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
          ppsNumberTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[]`
      ),
      isNull(models.users.deletedAt)
    ),
  });

  if (
    (maritalStatus === 'married' || maritalStatus === 'civil_partnership') &&
    spouse &&
    sEmailTrigramHashes &&
    sPhoneTrigramHashes &&
    sPpsTrigramHashes
  ) {
    spouseExist = await db.query.users.findFirst({
      where: and(
        or(
          sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
            sEmailTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
            sEmailTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[]`,
          sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
            sPhoneTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
            sPhoneTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[]`,
          sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
            sPpsTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
            sPpsTrigramHashes.map((h: string) => sql`${h}`),
            sql`, `
          )}]::text[]`
        ),
        isNull(models.users.deletedAt)
      ),
    });
  }

  // Simple validation: if userExist was found and is verified, throw error
  if (userExist && (userExist?.isEmailOtpVerified || userExist?.isPhoneOtpVerified)) {
    throw new ApiError('An account already exists with this email, phone, or PPS number', 409);
  }

  // Validate spouse uniqueness
  if (
    (maritalStatus === 'married' || maritalStatus === 'civil_partnership') &&
    spouse &&
    spouseExist &&
    (spouseExist?.isEmailOtpVerified || spouseExist?.isPhoneOtpVerified)
  ) {
    throw new ApiError('Spouse email, phone, or PPS number already exists', 409);
  }

  let otp = 123456;

  if (isProduction) {
    otp = generateOTP();
  }
  // const otp = 123456; // TODO: Replace with real OTP generation
  const otpExpiresIn = new Date(Date.now() + OTP_EXPIRATION_TIME);

  // Fetch all required active policies in one query, map by type, and validate
  const requiredTypes = [
    policyTypes.PRIVACY_POLICY,
    policyTypes.COOKIES_POLICY,
    policyTypes.FEE_STRUCTURE,
    policyTypes.TERMS_CONDITIONS,
  ] as const;

  const policies = await db.query.policies.findMany({
    where: and(
      inArray(models.policies.type, requiredTypes as unknown as string[]),
      eq(models.policies.isActive, true)
    ),
    columns: { id: true, type: true },
    limit: requiredTypes.length,
  });

  const policyByType = new Map(policies.map((p) => [p.type, p]));
  const missing = requiredTypes.filter((t) => !policyByType.has(t));
  if (missing.length) {
    throw new ApiError(
      `System configuration error: Missing active policies for types: ${missing.join(', ')}`
    );
  }

  const privacy = policyByType.get(policyTypes.PRIVACY_POLICY)!;
  const cookies = policyByType.get(policyTypes.COOKIES_POLICY)!;
  const fee = policyByType.get(policyTypes.FEE_STRUCTURE)!;
  const terms = policyByType.get(policyTypes.TERMS_CONDITIONS)!;

  const now = new Date();
  const hashedPassword = await bcrypt.hash(password, 10);
  let data = null;

  if (userExist) {
    // Update existing user
    const { existingUserData, existingSpouseUserData } = await db.transaction(async (tx) => {
      let existingSpouseUserData: {
        id: string;
        name: string;
        email: string;
        phone: string;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
      } | null = null;
      const [existingUserData] = await tx
        .update(models.users)
        .set({
          name,
          email,
          emailTrigramHashes,
          phoneTrigramHashes,
          ppsNumberTrigramHashes,
          nameTrigramHashes,
          professionTrigramHashes,
          phone,
          dob,
          profession,
          ppsNumber: ppsNo,
          address,
          eircode,
          maritalStatus,
          password: hashedPassword,
          passwordSetAt: dateToString(now),
          status: true,
          isEmailOtpVerified: false,
          isPhoneOtpVerified: false,
          emailOtp: otpToString(otp),
          emailOtpExpires: dateToString(otpExpiresIn),
          privacyPolicyId: privacy.id,
          cookiePolicyId: cookies.id,
          feeStructureId: fee.id,
          termsAndConditionId: terms.id,
          isSignatureConsentCompleted: isProduction ? false : true,
          signatureConsentCompletedAt: isProduction ? null : dateToString(new Date()),
        })
        .where(eq(models.users.id, userExist.id))
        .returning({
          id: models.users.id,
          name: models.users.name,
          email: models.users.email,
          phone: models.users.phone,
          isEmailVerified: models.users.isEmailOtpVerified,
          isPhoneVerified: models.users.isPhoneOtpVerified,
          isSignatureConsentCompleted: models.users.isSignatureConsentCompleted,
        });

      // If spouse details provided, create or update spouse record
      if ((maritalStatus === 'married' || maritalStatus === 'civil_partnership') && spouse) {
        if (spouseExist) {
          // Update existing spouse record
          [existingSpouseUserData] = await tx
            .update(models.users)
            .set({
              parentId: userExist.id,
              name: spouse.name,
              email: spouse.email,
              emailTrigramHashes: sEmailTrigramHashes!,
              phoneTrigramHashes: sPhoneTrigramHashes!,
              ppsNumberTrigramHashes: sPpsTrigramHashes!,
              nameTrigramHashes: sNameTrigramHashes!,
              professionTrigramHashes: sProfessionTrigramHashes!,
              phone: spouse.phone,
              dob: spouse.dob,
              profession: spouse.profession,
              ppsNumber: spouse.ppsNo,
              address: spouse.address,
              eircode: spouse.eircode,
              maritalStatus: maritalStatus,
              password: spouse.password ? await bcrypt.hash(spouse.password, 10) : undefined,
              passwordSetAt: spouse.password ? dateToString(now) : undefined,
              status: true,
              isEmailOtpVerified: true,
              emailVerifiedAt: dateToString(now),
              isPhoneOtpVerified: false,
              privacyPolicyId: privacy.id,
              cookiePolicyId: cookies.id,
              feeStructureId: fee.id,
              termsAndConditionId: terms.id,
              isPrimaryAccount: false,
              isSignatureConsentCompleted: isProduction ? false : true,
              signatureConsentCompletedAt: isProduction ? null : dateToString(new Date()),
            })
            .where(eq(models.users.id, spouseExist.id))
            .returning({
              id: models.users.id,
              name: models.users.name,
              email: models.users.email,
              phone: models.users.phone,
              isEmailVerified: models.users.isEmailOtpVerified,
              isPhoneVerified: models.users.isPhoneOtpVerified,
              isSignatureConsentCompleted: models.users.isSignatureConsentCompleted,
            });
        } else {
          // Create new spouse record
          const spouseUser: UserInsert = {
            parentId: userExist.id,
            name: spouse.name,
            email: spouse.email,
            emailTrigramHashes: sEmailTrigramHashes!,
            phoneTrigramHashes: sPhoneTrigramHashes!,
            ppsNumberTrigramHashes: sPpsTrigramHashes!,
            nameTrigramHashes: sNameTrigramHashes!,
            phone: spouse.phone,
            dob: spouse.dob,
            profession: spouse.profession,
            ppsNumber: spouse.ppsNo,
            address: spouse.address,
            eircode: spouse.eircode,
            maritalStatus: maritalStatus,
            password: await bcrypt.hash(spouse.password, 10),
            passwordSetAt: dateToString(now),
            status: true,
            isEmailOtpVerified: true,
            emailVerifiedAt: dateToString(now),
            isPhoneOtpVerified: false,
            privacyPolicyId: privacy.id,
            cookiePolicyId: cookies.id,
            feeStructureId: fee.id,
            termsAndConditionId: terms.id,
            isPrimaryAccount: false,
            isSignatureConsentCompleted: isProduction ? false : true,
            signatureConsentCompletedAt: isProduction ? null : dateToString(new Date()),
          };
          [existingSpouseUserData] = await tx.insert(models.users).values(spouseUser).returning({
            id: models.users.id,
            name: models.users.name,
            email: models.users.email,
            phone: models.users.phone,
            isEmailVerified: models.users.isEmailOtpVerified,
            isPhoneVerified: models.users.isPhoneOtpVerified,
          });
        }
      }
      return { existingUserData, existingSpouseUserData };
    });

    // Set response data for existing user update
    data = {
      ...existingUserData,
      spouse: existingSpouseUserData,
    };
  } else {
    // Create new user
    const mainUser: UserInsert = {
      name,
      email,
      emailTrigramHashes,
      phoneTrigramHashes,
      ppsNumberTrigramHashes,
      nameTrigramHashes,
      professionTrigramHashes,
      phone,
      dob,
      profession,
      ppsNumber: ppsNo,
      address,
      eircode,
      maritalStatus,
      password: hashedPassword,
      passwordSetAt: dateToString(now),
      status: true,
      isEmailOtpVerified: false,
      isPhoneOtpVerified: false,
      emailOtp: otpToString(otp),
      emailOtpExpires: dateToString(otpExpiresIn),
      privacyPolicyId: privacy.id,
      cookiePolicyId: cookies.id,
      feeStructureId: fee.id,
      termsAndConditionId: terms.id,
      isSignatureConsentCompleted: isProduction ? false : true,
      signatureConsentCompletedAt: isProduction ? null : dateToString(new Date()),
      isJointAssessment: !!((maritalStatus === 'married' || maritalStatus === 'civil_partnership') && spouse),
    };

    type NewUser = {
      id: string;
      name: string;
      email: string;
      phone: string;
      isEmailVerified: boolean;
      isPhoneVerified: boolean;
    };

    const { mainUserData, spouseUserData } = await db.transaction(async (tx) => {
      const [mainUserData] = await tx.insert(models.users).values(mainUser).returning({
        id: models.users.id,
        name: models.users.name,
        email: models.users.email,
        phone: models.users.phone,
        isEmailVerified: models.users.isEmailOtpVerified,
        isPhoneVerified: models.users.isPhoneOtpVerified,
      });

      let spouseUserData: NewUser | null = null;

      if ((maritalStatus === 'married' || maritalStatus === 'civil_partnership') && spouse) {
        const spouseUser: UserInsert = {
          parentId: mainUserData.id,
          name: spouse.name,
          email: spouse.email,
          emailTrigramHashes: sEmailTrigramHashes!,
          phoneTrigramHashes: sPhoneTrigramHashes!,
          ppsNumberTrigramHashes: sPpsTrigramHashes!,
          nameTrigramHashes: sNameTrigramHashes!,
          phone: spouse.phone,
          dob: spouse.dob,
          profession: spouse.profession,
          ppsNumber: spouse.ppsNo,
          address: spouse.address,
          eircode: spouse.eircode,
          maritalStatus: maritalStatus,
          password: await bcrypt.hash(spouse.password, 10),
          passwordSetAt: dateToString(now),
          status: true,
          isEmailOtpVerified: true,
          emailVerifiedAt: dateToString(now),
          isPhoneOtpVerified: false,
          privacyPolicyId: privacy.id,
          cookiePolicyId: cookies.id,
          feeStructureId: fee.id,
          termsAndConditionId: terms.id,
          isPrimaryAccount: false,
          isSignatureConsentCompleted: isProduction ? false : true,
          signatureConsentCompletedAt: isProduction ? null : dateToString(new Date()),
          isJointAssessment: true,
        };

        [spouseUserData] = await tx.insert(models.users).values(spouseUser).returning({
          id: models.users.id,
          name: models.users.name,
          email: models.users.email,
          phone: models.users.phone,
          isEmailVerified: models.users.isEmailOtpVerified,
          isPhoneVerified: models.users.isPhoneOtpVerified,
        });
      }

      return { mainUserData, spouseUserData };
    });

    // Set response data for new user creation
    data = {
      ...mainUserData,
      spouse: spouseUserData,
    };
  }

  // Update WhatsApp chats for user registration
  const hashedPhoneForWhatsApp = hashWithHMAC(phone);
  await db
    .update(models.whatsappChats)
    .set({
      isRegistered: true,
      userId: data.id,
    })
    .where(eq(models.whatsappChats.hashedPhone, hashedPhoneForWhatsApp));

  if (data.spouse && spouse) {
    const hashedSpousePhoneForWhatsApp = hashWithHMAC(spouse.phone);
    await db
      .update(models.whatsappChats)
      .set({
        isRegistered: true,
        userId: data.spouse.id,
      })
      .where(eq(models.whatsappChats.hashedPhone, hashedSpousePhoneForWhatsApp));
  }

  if (data.spouse) {
    Promise.all([
      mail.welcomeEmail({
        recipient: data.spouse.email,
        replacements: {
          username: data.spouse.name,
          support_email: 'support@taxmind.ie',
          support_phone: '+353 871986494 ',
        },
      }),
      isProduction &&
      sendSignatureRequest({
        name: data.spouse.name,
        email: data.spouse.email,
      }),
      // mail.termsAndConditions({ recipient: data.spouse.email, replacements: {} }),
    ]).catch((err) => logger.error('Error sending spouse welcome email:', err));
  }

  //  EMAIL: send welcome email and verification code for main user only
  Promise.all([
    mail.welcomeEmail({
      recipient: email,
      replacements: {
        username: data.name,
        support_email: 'support@taxmind.ie',
        support_phone: '+353 871986494 ',
      },
    }),
    // mail.termsAndConditions({ recipient: email, replacements: {} }),
    // mail.verifyEmail({ recipient: email, replacements: { otp, name: data.name } }),
    isProduction &&
    sendSignatureRequest({
      name: data.name,
      email: data.email,
    }),
  ]).catch((err) => logger.error('Error sending welcome email:', err));

  // Start Twilio Verify for the phone number
  // const verify = await twilioVerifyPhone(phone);
  // if (!verify.success) {
  //   throw new ApiError(verify.error || 'Failed to start phone verification');
  // }
  return res.success('Signup successfully. Please verify your phone number', data);
});

export const signIn = serviceHandler(signInSchema, async (req, res) => {
  const { email, password } = req.body;

  let spouseUser:
    | {
      id: string;
      name: string;
      email: string;
      phone: string;
      emailVerifiedAt: string | null;
      phoneVerifiedAt: string | null;
      isPrimaryAccount: boolean;
      parentId: string | null;
      isSignatureConsentCompleted: boolean | null;
    }
    | undefined;

  // Generate trigram hashes for email exact matching
  const emailTrigramHashes = hashTrigrams(email.toLowerCase());

  const user = await db.query.users.findFirst({
    where: and(
      sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`
    ),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      password: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isPrimaryAccount: true,
      parentId: true,
      status: true,
      isSignatureConsentCompleted: true,
      fcmToken: true,
      isAppNotificationEnabled: true,
      deletedAt: true,
      isReturnUser: true,
      remark: true,
    },
    with: {
      parentUser: {
        columns: {
          id: true,
          name: true,
          email: true,
          phone: true,
          password: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          isPrimaryAccount: true,
          parentId: true,
          isSignatureConsentCompleted: true,
        },
      },
    },
  });

  if (!user) throw new ApiError('Invalid credentials');

  if (user?.parentUser) spouseUser = user?.parentUser;

  // If this is a primary account (no parentId), fetch the linked spouse account (child) if it exists
  if (!user.parentUser) {
    spouseUser = await db.query.users.findFirst({
      where: eq(models.users.parentId, user.id),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isPrimaryAccount: true,
        parentId: true,
        isSignatureConsentCompleted: true,
      },
    });
  }

  const data = {
    id: user?.id,
    name: user?.name,
    email: user?.email,
    phone: user?.phone,
    isEmailVerified: !!user?.emailVerifiedAt,
    isPhoneVerified: !!user?.phoneVerifiedAt,
    isSignatureConsentCompleted: user.isSignatureConsentCompleted,

    spouse: spouseUser
      ? {
        id: spouseUser?.id,
        name: spouseUser?.name,
        email: spouseUser?.email,
        phone: spouseUser?.phone,
        isEmailVerified: !!spouseUser?.emailVerifiedAt,
        isPhoneVerified: !!spouseUser?.phoneVerifiedAt,
        isSignatureConsentCompleted: spouseUser.isSignatureConsentCompleted,
      }
      : null,
  };

  if (
    user.emailVerifiedAt &&
    user.phoneVerifiedAt &&
    user.isSignatureConsentCompleted &&
    user.password === null
  ) {
    return res.success('A verification code is send to your email. Please verify your email', {
      ...data,
      isPasswordResetRequired: true,
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password || '');
  if (!isPasswordValid) throw new ApiError('Invalid credentials');

  if (!user?.phoneVerifiedAt) {
    return res.success('A verification code is send to your phone. Please verify your phone', {
      ...data,
      isPasswordResetRequired: false,
    });
  }

  if (!user?.emailVerifiedAt) {
    const otp = generateOTP();
    // const otp = 123456; // TODO: Replace with real OTP generation
    const otpExpiresIn = new Date(Date.now() + OTP_EXPIRATION_TIME);
    await db
      .update(models.users)
      .set({
        emailOtp: otpToString(otp),
        emailOtpExpires: dateToString(otpExpiresIn),
      })
      .where(eq(models.users.id, user.id));

    //  EMAIL: send verification code
    // await mail.verifyEmail({ recipient: email, replacements: { otp, name: user.name } });
    // if (user.fcmToken) {
    //   await sendNotification({
    //     tokens: [user.fcmToken],
    //     payload: {
    //       title: notificationTemplates.verifyEmail.title,
    //       body: notificationTemplates.verifyEmail.body,
    //     },
    //     data: { type: notificationTemplates.verifyEmail.type },
    //   });
    // }

    // notificationHandler({
    //   tokens: user.fcmToken?.split(','),
    //   payload: notificationTemplates.verifyEmail,
    //   data: {
    //     type: notificationTemplates.verifyEmail.type,
    //   },
    //   userId: user.id,
    //   appNotificationsEnabled: user.isAppNotificationEnabled,
    // });
    return res.success('A verification code is send to your email. Please verify your email', {
      ...data,
      isPasswordResetRequired: false,
    });
  }

  // if (!user?.phoneVerifiedAt) {
  //   const otp = generateOTP();
  //   const otpExpiresIn = new Date(Date.now() + OTP_EXPIRATION_TIME);
  //   await db
  //     .update(models.users)
  //     .set({
  //       phoneOtp: otpToString(otp),
  //       phoneOtpExpires: dateToString(otpExpiresIn),
  //     })
  //     .where(eq(models.users.id, user.id));

  //   //  SMS: send verification code phone number
  //   return res.success('A verification code is send to your phone. Please verify your phone', data);
  // }

  if (user.deletedAt || !user.status) {
    return res.success('Account reactivation required', {
      ...data,
      isOffBoarded: true,
      lastRemark: user.remark,
    });
  }

  // Enforce phone verification on each login via Twilio Verify
  // if (user.phone) {
  //   const verify = await twilioVerifyPhone(user.phone);
  //   if (!verify.success) {
  //     logger.error(`Failed to start phone verification during signIn: ${verify.error}`);
  //     throw new ApiError('Failed to send verification code to phone');
  //   }
  //   return res.success('A verification code is sent to your phone. Please verify to continue', {
  //     ...data,
  //     isPasswordResetRequired: false,
  //   });
  // }

  if (!user.isSignatureConsentCompleted) {
    throw new ApiError('Please complete the signature consent send to your email', 403);
  }

  return res.success('A verification code is sent to your email. Please verify to continue', {
    ...data,
    isPasswordResetRequired: false,
  });
});

export const reactivateAccount = serviceHandler(reactivateAccountSchema, async (req, res) => {
  const { email } = req.body;
  const emailTrigramHashes = hashTrigrams(email.toLowerCase());

  const user = await db.query.users.findFirst({
    where: sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
      emailTrigramHashes.map((h) => sql`${h}`),
      sql`, `
    )}]::text[]`,
  });

  if (!user) throw new ApiError('User not found');

  await db
    .update(models.users)
    .set({
      deletedAt: null,
      status: true,
      isReturnUser: true,
      returnedAt: new Date(),
    })
    .where(eq(models.users.id, user.id));

  // Trigger internal notification to admin
  try {
    const activeAdmins = await db.query.admins.findMany({
      where: eq(models.admins.status, true),
    });

    if (activeAdmins.length > 0) {
      await adminNotificationHandler({
        payload: {
          title: 'User Reactivated',
          body: `User ${user.email} has reactivated their account.`,
          type: notificationTypes.userReactivated.key,
        },
        adminIds: activeAdmins.map((admin) => admin.id),
        tokens: activeAdmins.map((admin) => admin.fcmToken).filter((t): t is string => !!t),
      });
    }

    logger.info(`User ${user.email} has reactivated their account.`);
  } catch (err) {
    logger.error('Failed to trigger admin notification for reactivation:', err);
  }

  return res.success('Account reactivated successfully. You can now log in.');
});

export const verifyEmail = serviceHandler(verifyEmailSchema, async (req, res) => {
  const { email, otp } = req.body;

  const emailTrigramHashes = hashTrigrams(email.toLowerCase());

  const user = await db.query.users.findFirst({
    where: and(
      sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      isNull(models.users.deletedAt)
    ),
  });

  if (!user) throw new ApiError('Email address not registered');
  if (!user.phoneVerifiedAt) {
    throw new ApiError('Please verify your phone number first');
  }
  let otpString = '';
  if (typeof otp === 'number') {
    otpString = otpToString(otp);
  } else {
    otpString = otp;
  }

  // console.log(otpString);

  if (user.emailOtp !== otpString || new Date(user.emailOtpExpires || '') < new Date()) {
    throw new ApiError('Invalid OTP or OTP has expired');
  }
  let spouse = null;
  let filters: (SQL | undefined)[] = [];

  // If user is a parent (parentId is null), find child as spouse
  if (!user.parentId) {
    filters.push(eq(models.users.parentId, user.id));
    filters.push(isNull(models.users.deletedAt));
  } else {
    // If user is a child (has parentId), find parent as spouse
    filters.push(eq(models.users.id, user.parentId));
    filters.push(isNull(models.users.deletedAt));
  }

  spouse = await db.query.users.findFirst({
    where: and(...filters),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ppsNumber: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isSignatureConsentCompleted: true,
      maritalStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Generate access and refresh tokens
  const payload = { id: user.id, type: 'USER' };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE,
  } as jwt.SignOptions);

  await db
    .update(models.users)
    .set({
      isEmailOtpVerified: true,
      emailVerifiedAt: dateToString(new Date()),
      emailOtp: '',
      emailOtpExpires: '',
      accessToken,
      refreshToken,
    })
    .where(eq(models.users.id, user.id));

  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    isEmailVerified: true,
    accessToken,
    refreshToken,
    spouse: spouse
      ? {
        ...spouse,
        isEmailVerified: !!spouse.emailVerifiedAt,
        isPhoneVerified: !!spouse.phoneVerifiedAt,
      }
      : null,
  };

  return res.success('Email verified successfully', userData);
});

export const signOut = serviceHandler(async (req, res) => {
  await db
    .update(models.users)
    .set({ accessToken: null, refreshToken: null })
    .where(eq(models.users.id, req.admin.id));

  return res.success('Signout successfully');
});

export const changePassword = serviceHandler(changePasswordSchema, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const isPasswordValid = await bcrypt.compare(currentPassword, req.user.password || '');
  if (!isPasswordValid) throw new ApiError('Incorrect current password');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await db
    .update(models.users)
    .set({
      password: hashedPassword,
      passwordSetAt: dateToString(new Date()),
    })
    .where(eq(models.users.id, req.user.id));

  return res.success('Password changed successfully');
});

export const getAccessToken = serviceHandler(getAccessTokenSchema, async (req, res) => {
  const { email } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) throw new ApiError('Unauthorized', 401);

  const refreshToken = authHeader.split(' ')[1];
  if (!refreshToken) throw new ApiError('Unauthorized', 401);

  const emailTrigramHashes = hashTrigrams(email.toLowerCase());

  const user = await db.query.users.findFirst({
    where: and(
      sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      isNull(models.users.deletedAt)
    ),
  });

  if (!user) throw new ApiError('Unauthorized', 401);

  if (user.refreshToken !== refreshToken) throw new ApiError('Unauthorized', 401);

  try {
    jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
  } catch (error) {
    logger.error((error as Error).message);
    throw new ApiError('Unauthorized', 401);
  }

  if (user && !user.status)
    throw new ApiError('Your account has been blocked by administrator.', 423);

  const accessToken = jwt.sign({ id: user.id, type: 'USER' }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE,
  } as jwt.SignOptions);

  await db.update(models.users).set({ accessToken }).where(eq(models.users.id, user.id));

  return res.success('Access token refreshed successfully', {
    name: user.name,
    email: user.email,
    phone: user.phone,
    accessToken,
    refreshToken: user.refreshToken,
  });
});

export const emailVerificationCode = serviceHandler(
  emailVerificationCodeSchema,
  async (req, res) => {
    const { email } = req.body;

    const emailTrigramHashes = hashTrigrams(email.toLowerCase());

    const user = await db.query.users.findFirst({
      where: and(
        sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
          emailTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
          emailTrigramHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[]`,
        isNull(models.users.deletedAt)
      ),
    });

    if (!user) throw new ApiError('Email not found');
    if (!user.phoneVerifiedAt) {
      throw new ApiError('Please verify your phone number first');
    }

    let otp = 123456;
    if (process.env.NODE_ENV === 'production') {
      otp = generateOTP();
    }
    const otpExpiresIn = new Date(Date.now() + OTP_EXPIRATION_TIME);

    await db
      .update(models.users)
      .set({
        emailOtp: otpToString(otp),
        emailOtpExpires: dateToString(otpExpiresIn),
      })
      .where(eq(models.users.id, user.id));

    await mail.verifyEmail({ recipient: email, replacements: { otp, name: user.name } });
    // if (user.fcmToken) {
    //   await sendNotification({
    //     tokens: [user.fcmToken],
    //     payload: {
    //       title: notificationTemplates.verifyEmail.title,
    //       body: notificationTemplates.verifyEmail.body,
    //     },

    //     data: { type: notificationTemplates.verifyEmail.type },
    //   });
    // }
    // notificationHandler({
    //   tokens: user.fcmToken?.split(','),
    //   payload: notificationTemplates.verifyEmail,
    //   data: {
    //     type: notificationTemplates.verifyEmail.type,
    //   },
    //   userId: user.id,
    //   appNotificationsEnabled: user.isAppNotificationEnabled,
    // });
    return res.success('Verification code sent to your email');
  }
);

export const phoneVerificationCode = serviceHandler(
  phoneVerificationCodeSchema,
  async (req, res) => {
    const { phone } = req.body;

    // Generate trigram hashes for phone exact matching
    const phoneTrigramHashes = hashTrigrams(phone);

    const user = await db.query.users.findFirst({
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
    if (!user) throw new ApiError('User not found');
    // if (!user.emailVerifiedAt)
    //   throw new ApiError('Please verify your email before phone verification');

    // Send verification code via Twilio Verify service
    const verify = await twilioVerifyPhone(phone);
    if (!verify.success) {
      throw new ApiError(verify.error || 'Failed to send verification code to phone');
    }
    return res.success('Verification code sent to your phone');
  }
);

export const verifyPhone = serviceHandler(verifyPhoneSchema, async (req, res) => {
  const { phone, otp } = req.body;

  // Generate trigram hashes for phone exact matching
  const phoneTrigramHashes = hashTrigrams(phone);

  const user = await db.query.users.findFirst({
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
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ppsNumber: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isPrimaryAccount: true,
      parentId: true,
      status: true,
      isSignatureConsentCompleted: true,
      maritalStatus: true,
      // phoneOtp: true,
      // phoneOtpExpires: true,
    },
  });

  if (!user) throw new ApiError('Mobile number not registered');
  // if (!user.emailVerifiedAt)
  //   throw new ApiError('Please verify your email before phone verification');

  // Verify OTP using Twilio Verify service
  const result = await twilioCheckVerification({ phone, otp: String(otp) });
  if (!result.success || !result.valid) {
    throw new ApiError('Invalid OTP or OTP has expired');
  }

  // let spouse = null;
  // let filters: (SQL | undefined)[] = [];

  // // If user is a parent (parentId is null), find child as spouse
  // if (!user.parentId) {
  //   filters.push(eq(models.users.parentId, user.id));
  //   filters.push(isNull(models.users.deletedAt));
  // } else {
  //   // If user is a child (has parentId), find parent as spouse
  //   filters.push(eq(models.users.id, user.parentId));
  //   filters.push(isNull(models.users.deletedAt));
  // }

  // spouse = await db.query.users.findFirst({
  //   where: and(...filters),
  //   columns: {
  //     id: true,
  //     name: true,
  //     email: true,
  //     phone: true,
  //     ppsNumber: true,
  //     status: true,
  //     emailVerifiedAt: true,
  //     phoneVerifiedAt: true,
  //     isSignatureConsentCompleted: true,
  //     maritalStatus: true,
  //     createdAt: true,
  //     updatedAt: true,
  //   },
  // });

  // const payload = { id: user.id, type: 'USER' };
  // const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET!, {
  //   expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE,
  // } as jwt.SignOptions);
  // const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET!, {
  //   expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE,
  // } as jwt.SignOptions);

  // // Issue tokens if user is not married; if married, only after spouse's email and phone OTP are verified
  // // const spouseEmailVerified = !!spouseUser?.emailVerifiedAt;
  // // const spousePhoneVerified = !!spouseUser?.isPhoneOtpVerified;
  // // const allowTokens =
  // //   user.maritalStatus !== 'married' || (spouseEmailVerified && spousePhoneVerified);

  // const allowTokens = !!user?.emailVerifiedAt && result.success;
  await db
    .update(models.users)
    .set({
      isPhoneOtpVerified: true,
      phoneVerifiedAt: dateToString(new Date()),
      phoneOtp: '',
      phoneOtpExpires: ''
    })
    .where(eq(models.users.id, user.id));

  // const userData = {
  //   ...user,
  //   isEmailVerified: !!user.emailVerifiedAt,
  //   isPhoneVerified: !!user.phoneVerifiedAt,
  //   accessToken: allowTokens ? accessToken : null,
  //   refreshToken: allowTokens ? refreshToken : null,
  //   spouse: spouse
  //     ? {
  //         ...spouse,
  //         isEmailVerified: !!spouse.emailVerifiedAt,
  //         isPhoneVerified: !!spouse.phoneVerifiedAt,
  //       }
  //     : null,
  // };

  return res.success('Phone verified successfully');
});

export const resetPassword = serviceHandler(resetPasswordSchema, async (req, res) => {
  const { email, newPassword, otp } = req.body;

  // Hash email for searching
  const emailTrigramHashes = hashTrigrams(email.toLowerCase());

  const user = await db.query.users.findFirst({
    where: and(
      sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
        emailTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      isNull(models.users.deletedAt)
    ),
  });

  if (!user) throw new ApiError('Account not found');
  let otpString = '';
  if (typeof otp === 'number') {
    otpString = otpToString(otp);
  } else {
    otpString = otp;
  }
  if (user.emailOtp !== otpString || new Date(user.emailOtpExpires || '') < new Date()) {
    throw new ApiError('Invalid OTP or OTP has expired');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await db
    .update(models.users)
    .set({
      password: hashedPassword,
      passwordSetAt: dateToString(new Date()),
      emailOtp: null,
      emailOtpExpires: null,
    })
    .where(eq(models.users.id, user.id));

  return res.success('Password reset successfully', {
    name: user.name,
  });
});

// Admin-only: agent activation upload
export const uploadAgentActivationData = serviceHandler(
  agentActivationUploadSchema,
  async (req, res) => {
    const records = req.body;
    const APPROVED_DOC_TYPE = 'Approved Agent Link';

    if (!records?.length) {
      return res.success('No records to process', {
        processed: 0,
        matchedUsers: 0,
        updated: 0,
      });
    }

    // Helper function to safely parse and trim string values
    const safeString = (value: unknown): string => String(value || '').trim();

    // Parse and separate records in single pass
    const parsedRecords: Array<{
      noticeNo: string;
      customerName: string;
      regnTraderNo: string;
      mandatoryEFiler: string;
      taxTypeDutyRep: string;
      documentType: string;
      periodBegin: string;
      issuedDate: string;
      archivedBy: string;
    }> = [];

    // Single pass through records for parsing and filtering
    for (const rec of records) {
      const documentType = safeString(rec.documentType);
      const regnTraderNo = safeString(rec.regnTraderNo);
      const issuedDate = safeString(rec.issuedDate);

      const parsedRecord = {
        noticeNo: safeString(rec.noticeNo),
        customerName: safeString(rec.customerName),
        regnTraderNo,
        mandatoryEFiler: safeString(rec.mandatoryEFiler),
        taxTypeDutyRep: safeString(rec.taxTypeDutyRep),
        documentType,
        periodBegin: safeString(rec.periodBegin),
        issuedDate,
        archivedBy: safeString(rec.archivedBy),
      };

      parsedRecords.push(parsedRecord);
    }

    logger.info(
      `Processing ${records.length} total records, ${parsedRecords.length} parsed successfully`
    );

    // Early return if no valid records
    if (parsedRecords.length === 0) {
      return res.success('No valid records to process', {
        processed: 0,
        matchedUsers: 0,
        updated: 0,
      });
    }

    const results = await db.transaction(async (tx) => {
      // Step 1: Batch fetch all unique PPS numbers and generate trigram hashes
      const uniquePpsNumbers = [
        ...new Set(parsedRecords.map((r) => r.regnTraderNo).filter(Boolean)),
      ];
      const ppsToTrigramHashesMap = new Map<string, string[]>();

      for (const pps of uniquePpsNumbers) {
        ppsToTrigramHashesMap.set(pps, hashTrigrams(pps));
      }

      // Step 2: Fetch all users by matching PPS trigram hashes (exact match)
      // We'll query each PPS number individually to ensure exact matching
      const users: Array<{
        id: string;
        ppsNumber: string;
        isTaxAgentVerificationCompleted: boolean | null;
      }> = [];

      for (const [, trigramHashes] of ppsToTrigramHashesMap.entries()) {
        const matchedUsers = await tx.query.users.findMany({
          where: and(
            sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
              trigramHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
              trigramHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[]`,
            isNull(models.users.deletedAt)
          ),
          columns: { id: true, ppsNumber: true, isTaxAgentVerificationCompleted: true },
        });

        // Add matched users with their PPS number for mapping
        users.push(...matchedUsers);
      }

      // Create PPS-to-user mapping for O(1) lookups
      const ppsToUserMap = new Map(users.map((user) => [user.ppsNumber, user]));

      // Step 3: Batch fetch existing agent activations
      const userIds = users.map((u) => u.id);
      const existingActivations = await tx.query.agentActivations.findMany({
        where: inArray(models.agentActivations.userId, userIds),
        columns: { userId: true },
      });

      const existingActivationUserIds = new Set(existingActivations.map((a) => a.userId));

      // Step 4: Process agent activation records in batches
      const recordsToInsert: Array<any> = [];
      const recordsToUpdate: Array<{ record: any; userId: string }> = [];
      const userDataToUpdate: Array<{ userId: string; isActive: boolean }> = [];

      for (const record of parsedRecords) {
        if (!record.regnTraderNo) continue;

        // Look up user by PPS number directly
        const user = ppsToUserMap.get(record.regnTraderNo);

        if (user) {
          const isActive = record.documentType === APPROVED_DOC_TYPE;
          if (user.isTaxAgentVerificationCompleted !== isActive) {
            userDataToUpdate.push({ userId: user.id, isActive });
          }
          if (existingActivationUserIds.has(user.id)) {
            recordsToUpdate.push({ record, userId: user.id });
          } else {
            recordsToInsert.push({ ...record, userId: user.id });
          }
        }
      }

      // Batch insert new agent activation records
      if (recordsToInsert.length > 0) {
        await tx.insert(models.agentActivations).values(recordsToInsert);
        logger.info(`Inserted ${recordsToInsert.length} new agent activation records`);
      }

      // Batch update existing agent activation records
      if (recordsToUpdate.length > 0) {
        const now = new Date();
        for (const { record, userId } of recordsToUpdate) {
          await tx
            .update(models.agentActivations)
            .set({ ...record, updatedAt: now })
            .where(eq(models.agentActivations.userId, userId));
        }
        logger.info(`Updated ${recordsToUpdate.length} existing agent activation records`);
      }

      // Batch update user verification statuses
      if (userDataToUpdate.length > 0) {
        const now = new Date();

        // Group users by their target status for efficient batch updates
        const usersToActivate = userDataToUpdate.filter((u) => u.isActive).map((u) => u.userId);
        const usersToDeactivate = userDataToUpdate.filter((u) => !u.isActive).map((u) => u.userId);

        // Batch activate users
        if (usersToActivate.length > 0) {
          await tx
            .update(models.users)
            .set({
              isTaxAgentVerificationCompleted: true,
              taxAgentVerificationCompletedAt: now.toISOString(),
              updatedAt: now,
            })
            .where(inArray(models.users.id, usersToActivate));
        }

        // Batch deactivate users
        if (usersToDeactivate.length > 0) {
          await tx
            .update(models.users)
            .set({
              isTaxAgentVerificationCompleted: false,
              taxAgentVerificationCompletedAt: null,
              updatedAt: now,
            })
            .where(inArray(models.users.id, usersToDeactivate));
        }

        logger.info(
          `Updated tax agent verification for ${userDataToUpdate.length} users (${usersToActivate.length} activated, ${usersToDeactivate.length} deactivated)`
        );
      }

      return {
        processed: parsedRecords.length,
        matchedUsers: users.length,
        updated: userDataToUpdate.length,
        usersToActivate: userDataToUpdate.filter((u) => u.isActive).map((u) => u.userId),
      };
    });

    // Send emails to activated users after transaction completes
    if (results.usersToActivate && results.usersToActivate.length > 0) {
      try {
        const activatedUsers = await db.query.users.findMany({
          where: inArray(models.users.id, results.usersToActivate),
          columns: {
            id: true,
            name: true,
            email: true,
            fcmToken: true,
            isAppNotificationEnabled: true,
          },
        });

        // Send agent activation emails
        /* const emailPromises = activatedUsers.map((user) =>
          mail.agentActivationCompleted({
            recipient: user.email,
            replacements: { name: user.name },
          })
        ); */

        // Send FCM notifications
        activatedUsers.map((user) => {
          notificationHandler({
            tokens: user.fcmToken?.split(','),
            payload: notificationTemplates.agentActivationCompleted,
            data: { type: notificationTemplates.agentActivationCompleted.type },
            userId: user.id,
            appNotificationsEnabled: user.isAppNotificationEnabled,
          });
        });

        // await Promise.all(emailPromises);
        logger.info(`Sent agent activation emails to ${activatedUsers.length} users`);
      } catch (emailError) {
        // Log email errors but don't fail the entire operation
        logger.error('Failed to send agent activation emails:', emailError);
      }
    }

    return res.success('Agent activation data processed successfully', {
      processed: results.processed,
      matchedUsers: results.matchedUsers,
      updated: results.updated,
    });
  }
);

export const listAgentActivations = serviceHandler(listAgentActivationSchema, async (req, res) => {
  const { limit, offset, page, size } = req.pagination;

  // We want to see users who:
  // 1. Have requested activation (isTaxAgentVerificationRequestSent = true)
  // 2. OR have been activated (isTaxAgentVerificationCompleted = true)
  // 3. OR have a record in the agent_activations table (history)
  const whereClause = or(
    eq(models.users.isTaxAgentVerificationRequestSent, true),
    eq(models.users.isTaxAgentVerificationCompleted, true),
    sql`exists (select 1 from agent_activations where user_id = ${models.users.id})`
  );

  const [totalRecords, usersWithActivations] = await Promise.all([
    db.$count(models.users, and(isNull(models.users.deletedAt), whereClause)),
    db.query.users.findMany({
      where: and(isNull(models.users.deletedAt), whereClause),
      limit,
      offset,
      orderBy: desc(models.users.updatedAt),
      columns: {
        id: true,
        name: true,
        email: true,
        ppsNumber: true,
        isTaxAgentVerificationCompleted: true,
        isTaxAgentVerificationRequestSent: true,
      },
      with: {
        agentActivation: true,
      },
    }),
  ]);

  // Flatten the records to match the format expected by the frontend
  const records = usersWithActivations.map((user) => {
    const activation = (user.agentActivation || {}) as any;
    return {
      userId: user.id,
      noticeNo: activation.noticeNo || 'N/A',
      customerName: activation.customerName || user.name,
      regnTraderNo: activation.regnTraderNo || user.ppsNumber,
      mandatoryEFiler: activation.mandatoryEFiler || 'N/A',
      documentType: activation.documentType || (user.isTaxAgentVerificationRequestSent ? 'Pending Activation' : 'N/A'),
      periodBegin: activation.periodBegin || 'N/A',
      issuedDate: activation.issuedDate || 'N/A',
      taxTypeDutyReport: activation.taxTypeDutyReport || 'N/A',
      archivedBy: activation.archivedBy || 'N/A',
      isActivated: !!user.isTaxAgentVerificationCompleted,
      requestSent: !!user.isTaxAgentVerificationRequestSent,
    };
  });

  return res.success('Agent activations retrieved successfully', {
    totalRecords,
    records,
    pagination: {
      page,
      size,
      total: totalRecords,
    },
  });
});

export const getProfile = serviceHandler(async (req, res) => {
  const user = await db.query.users.findFirst({
    where: and(isNull(models.users.deletedAt), eq(models.users.id, req.user.id)),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ppsNumber: true,
      dob: true,
      profession: true,
      address: true,
      eircode: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isTaxAgentVerificationCompleted: true,
      isAppNotificationEnabled: true,
      isEmailNotificationEnabled: true,
      maritalStatus: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new ApiError('User not found');

  let spouse = null;

  // If user is a parent (parentId is null), find child as spouse
  if (!user.parentId) {
    spouse = await db.query.users.findFirst({
      where: and(eq(models.users.parentId, req.user.id), isNull(models.users.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } else {
    // If user is a child (has parentId), find parent as spouse
    spouse = await db.query.users.findFirst({
      where: and(eq(models.users.id, user.parentId), isNull(models.users.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Format user data with spouse information
  const userData = {
    ...user,
    isEmailVerified: !!user.emailVerifiedAt,
    isPhoneVerified: !!user.phoneVerifiedAt,
    spouse: spouse
      ? {
        ...spouse,
        isEmailVerified: !!spouse.emailVerifiedAt,
        isPhoneVerified: !!spouse.phoneVerifiedAt,
      }
      : null,
  };

  return res.success('Profile retrieved successfully', userData);
});

export const getUserDetails = serviceHandler(getUserDetailsSchema, async (req, res) => {
  const { userId } = req.params;

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ppsNumber: true,
      dob: true,
      profession: true,
      address: true,
      eircode: true,
      status: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isTaxAgentVerificationCompleted: true,
      isAppNotificationEnabled: true,
      isEmailNotificationEnabled: true,
      maritalStatus: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      isJointAssessment: true,
    },
  });

  if (!user) throw new ApiError('User not found');

  let spouse = null;

  // If user is a parent (parentId is null), find child as spouse
  if (!user.parentId) {
    spouse = await db.query.users.findFirst({
      where: and(eq(models.users.parentId, userId), isNull(models.users.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } else {
    // If user is a child (has parentId), find parent as spouse
    spouse = await db.query.users.findFirst({
      where: and(eq(models.users.id, user.parentId), isNull(models.users.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Format user data with spouse information
  const userData = {
    ...user,
    isEmailVerified: !!user.emailVerifiedAt,
    isPhoneVerified: !!user.phoneVerifiedAt,
    spouse: spouse
      ? {
        ...spouse,
        isEmailVerified: !!spouse.emailVerifiedAt,
        isPhoneVerified: !!spouse.phoneVerifiedAt,
      }
      : null,
  };

  return res.success('User details retrieved successfully', userData);
});

export const listUsers = serviceHandler(listUserSchema, async (req, res) => {
  const { keyword, startDate, endDate, sortBy, orderBy, status, profession } = req.query;
  const { limit, offset, page, size } = req.pagination;

  // Build filters (date range + keyword)
  const filters: (SQL | undefined)[] = [];

  // Apply status-based filters using switch statement
  switch (status) {
    case 'active':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.status, true)
      );
      break;

    case 'offboard':
      filters.push(isNotNull(models.users.deletedAt));
      break;

    case 'return':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.isReturnUser, true)
      );
      break;
    case 'pending':
      filters.push(isNull(models.users.deletedAt), eq(models.users.status, false));
      break;

    case 'unverified':
      filters.push(
        isNull(models.users.deletedAt),
        or(
          isNull(models.users.emailVerifiedAt),
          isNull(models.users.phoneVerifiedAt),
          eq(models.users.isSignatureConsentCompleted, false)
        )
      );
      break;

    case 'terminated':
      filters.push(isNotNull(models.users.deletedAt));
      break;

    case 'ros_not_updated':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.isTaxAgentVerificationCompleted, false),
        eq(models.users.isTaxAgentVerificationRequestSent, false)
      );
      break;

    case 'ros_updated':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.isTaxAgentVerificationCompleted, false),
        eq(models.users.isTaxAgentVerificationRequestSent, true)
      );
      break;

    case 'agent_activated':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.isTaxAgentVerificationCompleted, true)
      );
      break;

    case 'joint_assessment':
      filters.push(
        isNull(models.users.deletedAt),
        eq(models.users.isJointAssessment, true)
      );
      break;

    default:
      // Default to active users only (non-deleted)
      filters.push(isNull(models.users.deletedAt));
      break;
  }

  // Date range (refer admin service behavior)
  if (startDate && endDate) {
    filters.push(between(models.users.createdAt, startOfDay(startDate), endOfDay(endDate)));
  } else if (startDate) {
    filters.push(between(models.users.createdAt, startOfDay(startDate), endOfDay(new Date())));
  } else if (endDate) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    filters.push(between(models.users.createdAt, startOfDay(fromDate), endOfDay(endDate)));
  }
  // else {
  //   // Default to last 30 days to keep result bounded (admin style)
  //   const fromDate = new Date();
  //   fromDate.setDate(fromDate.getDate() - 30);
  //   filters.push(between(models.users.createdAt, startOfDay(fromDate), endOfDay(new Date())));
  // }

  // Keyword filter using trigram search with similarity scoring
  if (keyword) {
    // Hash the search keyword's trigrams
    const searchHashes = hashSearchKeyword(keyword.toLowerCase());

    // Calculate minimum number of trigrams that should match for relevance
    // For better accuracy, require at least 60% of trigrams to match
    const minMatches = Math.ceil(searchHashes.length * 0.6);

    // Use subquery with UNNEST to count matching trigrams
    // This gives us similarity scoring similar to ILIKE behavior
    filters.push(
      or(
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`
      )
    );
  }

  // Specific profession filter
  if (profession) {
    const professionHashes = hashSearchKeyword(profession.toLowerCase());
    // For specific filter, we want a high degree of similarity
    const minMatchesVal = Math.ceil(professionHashes.length * 0.8);
    filters.push(
      sql`(
        SELECT COUNT(*)
        FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
        WHERE t1 = ANY(ARRAY[${sql.join(
          professionHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
      ) >= ${minMatchesVal}`
    );
  }

  // Sorting: allow only a safe whitelist
  const sortField = (sortBy as string) || 'createdAt';
  const sortDir = ((orderBy as string) || 'desc').toLowerCase();

  const [totalUsers, users] = await Promise.all([
    db.$count(models.users, and(...filters)),
    db.query.users.findMany({
      where: and(...filters),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
        isTaxAgentVerificationRequestSent: true,
        taxAgentVerificationRequestSentAt: true,
        remark: true,
        isReturnUser: true,
        isJointAssessment: true,
        parentId: true,
      },
      limit,
      offset,
      orderBy: (user, { asc, desc }) => {
        const col = sortField === 'updatedAt' ? user.updatedAt : user.createdAt;
        return [
          sortDir === 'asc' ? asc(col) : desc(col),
          asc(user.id), // Secondary sort for deterministic pagination
        ];
      },
    }),
  ]);

  // Enrich joint assessment users with their paired spouse info
  const jointUsers = users.filter((u) => u.isJointAssessment || u.parentId);
  const parentsMap = new Map<string, { id: string; name: string }>();
  const childrenMap = new Map<string, { id: string; name: string }>();

  if (jointUsers.length > 0) {
    // Collect all parent IDs (for spouse users) and user IDs (for primary users)
    const parentIds = jointUsers.filter((u) => u.parentId).map((u) => u.parentId!);
    const primaryIds = jointUsers.filter((u) => !u.parentId).map((u) => u.id);

    // Fetch parents (for spouse users who have parentId)
    if (parentIds.length > 0) {
      const parents = await db.query.users.findMany({
        where: inArray(models.users.id, parentIds),
        columns: { id: true, name: true },
      });
      for (const p of parents) {
        parentsMap.set(p.id, { id: p.id, name: p.name });
      }
    }

    // Fetch children (spouses of primary users)
    if (primaryIds.length > 0) {
      const children = await db.query.users.findMany({
        where: and(inArray(models.users.parentId, primaryIds), isNull(models.users.deletedAt)),
        columns: { id: true, name: true, parentId: true },
      });
      for (const c of children) {
        if (c.parentId) {
          childrenMap.set(c.parentId, { id: c.id, name: c.name });
        }
      }
    }
  }

  // Attach pairedWith info to each user
  const enrichedUsers = users.map((u) => {
    const isJoint = u.isJointAssessment || !!u.parentId;
    if (!isJoint) return { ...u, pairedWith: null };

    if (u.parentId) {
      // This is a spouse user, paired with the parent
      const parent = parentsMap.get(u.parentId);
      return { ...u, pairedWith: parent || null };
    } else {
      // This is a primary user, paired with the child
      const child = childrenMap.get(u.id);
      return { ...u, pairedWith: child || null };
    }
  });

  return res.data('Users retrieved successfully', enrichedUsers, { page, size, total: totalUsers });
});
export const listOffBoardedUsers = serviceHandler(offBoardedUsersListSchema, async (req, res) => {
  const { keyword, startDate, endDate, sortBy, orderBy, profession } = req.query;
  const { limit, offset, page, size } = req.pagination;

  // Build filters (date range + keyword)
  const filters: (SQL | undefined)[] = [
    // Only soft-deleted users
    isNotNull(models.users.deletedAt),
  ];

  // Date range (refer admin service behavior)
  if (startDate && endDate) {
    filters.push(between(models.users.deletedAt, startOfDay(startDate), endOfDay(endDate)));
  } else if (startDate) {
    filters.push(between(models.users.deletedAt, startOfDay(startDate), endOfDay(new Date())));
  } else if (endDate) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    filters.push(between(models.users.deletedAt, startOfDay(fromDate), endOfDay(endDate)));
  }

  // Keyword filter using trigram search with similarity scoring
  if (keyword) {
    // Hash the search keyword's trigrams
    const searchHashes = hashSearchKeyword(keyword.toLowerCase());

    // Calculate minimum number of trigrams that should match for relevance
    // For better accuracy, require at least 60% of trigrams to match
    const minMatches = Math.ceil(searchHashes.length * 0.6);

    // Use subquery with UNNEST to count matching trigrams
    // This gives us similarity scoring similar to ILIKE behavior
    filters.push(
      or(
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.emailTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.nameTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`,
        sql`(
          SELECT COUNT(*)
          FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
          WHERE t1 = ANY(ARRAY[${sql.join(
          searchHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
        ) >= ${minMatches}`
      )
    );
  }

  // Specific profession filter
  if (profession) {
    const professionHashes = hashSearchKeyword(profession.toLowerCase());
    // For specific filter, we want a high degree of similarity
    const minMatchesVal = Math.ceil(professionHashes.length * 0.8);
    filters.push(
      sql`(
        SELECT COUNT(*)
        FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
        WHERE t1 = ANY(ARRAY[${sql.join(
          professionHashes.map((h) => sql`${h}`),
          sql`, `
        )}]::text[])
      ) >= ${minMatchesVal}`
    );
  }

  // Sorting: allow only a safe whitelist
  const sortField = (sortBy as string) || 'deletedAt';
  const sortDir = ((orderBy as string) || 'desc').toLowerCase();

  const [totalUsers, users] = await Promise.all([
    db.$count(models.users, and(...filters)),
    db.query.users.findMany({
      where: and(...filters),
      columns: {
        id: true,
        name: true,
        email: true,
        phone: true,
        ppsNumber: true,
        dob: true,
        profession: true,
        address: true,
        eircode: true,
        status: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isTaxAgentVerificationCompleted: true,
        isAppNotificationEnabled: true,
        isEmailNotificationEnabled: true,
        maritalStatus: true,
        createdAt: true,
        updatedAt: true,
      },
      limit,
      offset,
      orderBy: (user, { asc, desc }) => {
        const col = sortField === 'updatedAt' ? user.updatedAt : user.deletedAt;
        return [sortDir === 'asc' ? asc(col) : desc(col)];
      },
    }),
  ]);

  return res.data('Offboarded Users retrieved successfully', users, {
    page,
    size,
    total: totalUsers,
  });
});

// Allow either spouse to unbind (divorce scenario)
export const unbindSpouse = serviceHandler(unbindSpouseSchema, async (req, res) => {
  const user = req.user;

  // Determine main/spouse
  const mainUserId = user.parentId ?? user.id;
  const spouse = await db.query.users.findFirst({
    where: user.parentId
      ? eq(models.users.id, mainUserId) // requester is spouse, fetch main
      : eq(models.users.parentId, mainUserId), // requester is main, fetch spouse
    columns: { id: true },
  });
  if (!spouse) throw new ApiError('No linked spouse found', 404);

  await db.transaction(async (tx) => {
    // Set both to single; clear linkage (parentId = null on spouse)
    await tx
      .update(models.users)
      .set({ maritalStatus: 'single' })
      .where(eq(models.users.id, mainUserId));
    await tx
      .update(models.users)
      .set({ maritalStatus: 'single', parentId: null })
      .where(eq(models.users.id, spouse.id));
  });

  return res.success('Spouse unbound successfully');
});

/**
 * Helper function to soft delete all user-related data
 * @param userId - The user ID whose data should be soft deleted
 * @param tx - Database transaction object
 * @param now - Timestamp to use for deletedAt field
 */
async function softDeleteUserRelatedData(
  userId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  now: Date
): Promise<void> {
  // Get all user's applications
  const applications = await tx.query.applications.findMany({
    where: eq(models.applications.userId, userId),
    columns: { id: true },
  });
  const applicationIds = applications.map((app: { id: string }) => app.id);

  // Soft delete all related data that supports deletedAt
  if (applicationIds.length > 0) {
    // 1. Soft delete applications
    await tx
      .update(models.applications)
      .set({ deletedAt: now })
      .where(inArray(models.applications.id, applicationIds));

    // 2. Soft delete application notes
    await tx
      .update(models.applicationNotes)
      .set({ deletedAt: now })
      .where(inArray(models.applicationNotes.applicationId, applicationIds));

    // 3. Soft delete application document categories
    await tx
      .update(models.applicationDocumentCategories)
      .set({ deletedAt: now })
      .where(inArray(models.applicationDocumentCategories.applicationId, applicationIds));

    // 4. Soft delete application reviews
    await tx
      .update(models.applicationReviews)
      .set({ deletedAt: now })
      .where(inArray(models.applicationReviews.applicationId, applicationIds));

    // 5. Soft delete questionnaire responses
    await tx
      .update(models.questionnaireResponses)
      .set({ deletedAt: now })
      .where(inArray(models.questionnaireResponses.applicationId, applicationIds));

    // 6. Soft delete question responses (child of questionnaire responses)
    const questionnaireResponses = await tx.query.questionnaireResponses.findMany({
      where: inArray(models.questionnaireResponses.applicationId, applicationIds),
      columns: { id: true },
    });
    const questionnaireResponseIds = questionnaireResponses.map((qr: { id: string }) => qr.id);

    if (questionnaireResponseIds.length > 0) {
      await tx
        .update(models.questionResponses)
        .set({ deletedAt: now })
        .where(inArray(models.questionResponses.questionnaireResponseId, questionnaireResponseIds));
    }

    // 7. Soft delete payments
    await tx
      .update(models.payments)
      .set({ deletedAt: now })
      .where(inArray(models.payments.applicationId, applicationIds));

    // 8. Soft delete offline payment requests
    await tx
      .update(models.offlinePaymentRequests)
      .set({ deletedAt: now })
      .where(inArray(models.offlinePaymentRequests.applicationId, applicationIds));

    // 9. Soft delete chats related to applications
    await tx
      .update(models.chats)
      .set({ deletedAt: now })
      .where(inArray(models.chats.applicationId, applicationIds));
  }

  // 10. Soft delete all user chats (including non-application chats)
  await tx.update(models.chats).set({ deletedAt: now }).where(eq(models.chats.userId, userId));

  // 11. Soft delete whatsapp chats
  await tx
    .update(models.whatsappChats)
    .set({ deletedAt: now })
    .where(eq(models.whatsappChats.userId, userId));

  // 12. Delete user notifications (hard delete as they're just notifications)
  await tx.delete(models.userNotifications).where(eq(models.userNotifications.userId, userId));

  // 13. Soft delete agent activation
  const agentActivation = await tx.query.agentActivations.findFirst({
    where: eq(models.agentActivations.userId, userId),
    columns: { id: true },
  });

  if (agentActivation) {
    await tx
      .update(models.agentActivations)
      .set({ deletedAt: now })
      .where(eq(models.agentActivations.userId, userId));
  }
}

// Soft delete user account - marks deletedAt timestamp for 6-year retention
export const deleteAccount = serviceHandler(async (req, res) => {
  const userId = req.user.id;

  // Verify password before deletion
  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
    columns: { id: true, password: true, parentId: true, maritalStatus: true, deletedAt: true },
  });

  if (!user) throw new ApiError('User not found', 404);

  // Check if already deleted
  if (user.deletedAt) throw new ApiError('User account already offboarded', 400);

  const now = new Date();

  await db.transaction(async (tx) => {
    // Mark main user as deleted
    await tx
      .update(models.users)
      .set({
        deletedAt: now,
        updatedAt: now,
        // Clear sensitive data immediately for privacy
        accessToken: null,
        refreshToken: null,
        emailOtp: null,
        phoneOtp: null,
        emailOtpExpires: null,
        phoneOtpExpires: null,
      })
      .where(eq(models.users.id, userId));

    // Soft delete all user-related data
    await softDeleteUserRelatedData(userId, tx, now);

    // If user is married, also mark spouse for deletion
    if (user.maritalStatus === 'married') {
      const spouse = await db.query.users.findFirst({
        where: user.parentId
          ? eq(models.users.id, user.parentId) // requester is spouse, fetch main
          : eq(models.users.parentId, userId), // requester is main, fetch spouse
        columns: { id: true },
      });

      if (spouse)
        await tx
          .update(models.users)
          .set({ parentId: null, maritalStatus: 'single' })
          .where(eq(models.users.id, spouse.id));
    }
  });

  return res.success(
    'Account marked for deletion. Your data will be permanently removed after 6 years as per data retention policy.',
    { deletedAt: now.toISOString() }
  );
});

// Soft delete user account - marks deletedAt timestamp for 6-year retention
export const offboardUser = serviceHandler(async (req, res) => {
  const userId = req.params.userId;

  // Verify password before deletion
  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
    columns: {
      id: true,
      password: true,
      parentId: true,
      maritalStatus: true,
      deletedAt: true,
      name: true,
      email: true,
      fcmToken: true,
      isAppNotificationEnabled: true,
    },
  });

  if (!user) throw new ApiError('User not found', 404);

  // Check if already deleted
  if (user.deletedAt) throw new ApiError('User account already offboarded', 400);

  const now = new Date();

  await db.transaction(async (tx) => {
    // Mark main user as deleted
    await tx
      .update(models.users)
      .set({
        deletedAt: now,
        updatedAt: now,
        // Clear sensitive data immediately for privacy
        accessToken: null,
        refreshToken: null,
        emailOtp: null,
        phoneOtp: null,
        emailOtpExpires: null,
        phoneOtpExpires: null,
      })
      .where(eq(models.users.id, userId));

    // Soft delete all user-related data
    await softDeleteUserRelatedData(userId, tx, now);

    if (user.maritalStatus === 'married') {
      const spouse = await db.query.users.findFirst({
        where: user.parentId
          ? eq(models.users.id, user.parentId) // requester is spouse, fetch main
          : eq(models.users.parentId, userId), // requester is main, fetch spouse
        columns: { id: true },
      });

      if (spouse)
        await tx
          .update(models.users)
          .set({ parentId: null, maritalStatus: 'single' })
          .where(eq(models.users.id, spouse.id));
    }

    // Log the activity within the transaction
    const activityLogData = {
      entityName: activityLogEntityNames.user,
      entityId: user.id,
      action: 'delete' as const,
      modifiedUserId: req.admin.id,
      oldData: user,
      newData: null,
    };
    await activityLog(activityLogData);
  });

  await mail.offboardUser({ recipient: user.email, replacements: { name: user.name } });
  // if (user.fcmToken) {
  //   sendNotification({
  //     tokens: [user.fcmToken],
  //     payload: {
  //       title: notificationTemplates.offboardUser.title,
  //       body: notificationTemplates.offboardUser.body,
  //     },
  //     data: { type: notificationTemplates.offboardUser.type },
  //   });
  // }
  notificationHandler({
    tokens: user.fcmToken?.split(','),
    payload: notificationTemplates.offboardUser,
    data: {
      type: notificationTemplates.offboardUser.type,
    },
    userId: user.id,
    appNotificationsEnabled: user.isAppNotificationEnabled,
  });

  return res.success(
    'Account marked for deletion. Your data will be permanently removed after 6 years as per data retention policy.',
    { deletedAt: now.toISOString() }
  );
});

export const esignatureWebhook = serviceHandler(async (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));

  // const webhookSignature = req.headers['X-ZS-WEBHOOK-SIGNATURE'];
  // const zohoWebhookSecret = process.env.ZOHO_WEBHOOK_SECRET;

  // console.log('webhookSignature', webhookSignature);

  // // Validate webhook signature
  // const isValid = verifyHmacHash(
  //   zohoWebhookSecret,
  //   JSON.stringify(req.body),
  //   webhookSignature as string
  // );

  // if (!isValid) {
  //   throw new ApiError('Invalid webhook signature', 400);
  // }

  const payload = req.body;
  const requestStatus = payload.requests.request_status;
  console.log('requestStatus', requestStatus);

  if (requestStatus === 'completed') {
    const userEmail = payload.requests.actions[0].recipient_email;
    console.log('userEmail', userEmail);
    const emailTrigramHashes = hashTrigrams(userEmail.toLowerCase());

    await db
      .update(models.users)
      .set({
        isSignatureConsentCompleted: true,
        signatureConsentCompletedAt: new Date().toISOString(),
      })
      .where(
        and(
          sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
            emailTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
            emailTrigramHashes.map((h) => sql`${h}`),
            sql`, `
          )}]::text[]`,
          isNull(models.users.deletedAt)
        )
      );
  }
  return res.success('E-signature webhook received');
});

// =======================
// Queries Services (User submitted queries)
// =======================

// Public: Submit a user query/contact message
export const submitQuery = serviceHandler(submitQuerySchema, async (req, res) => {
  const { name, email, message, categoryId } = req.body;

  const exists = await db.query.queryCategories.findFirst({
    where: and(eq(models.queryCategories.id, categoryId), isNull(models.queryCategories.deletedAt)),
    columns: { id: true },
  });
  if (!exists) {
    throw new ApiError('Invalid category selected', 400);
  }

  const [created] = await db
    .insert(models.queries)
    .values({ name, email, message, categoryId: categoryId })
    .returning({ id: models.queries.id, createdAt: models.queries.createdAt });

  return res.success('Your query has been submitted', {
    id: created.id,
    name,
    email,
    message,
    categoryId: categoryId || null,
    createdAt: created.createdAt,
  });
});

export const listQueries = serviceHandler(listQueriesSchema, async (req, res) => {
  const { categoryId } = req.query;
  const { limit: limitPaginated, offset, page, size } = req.pagination;

  const whereConditions = [];
  if (categoryId) {
    whereConditions.push(eq(models.queries.categoryId, categoryId));
  }

  const queries = await db.query.queries.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    with: {
      category: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: desc(models.queries.createdAt),
    limit: limitPaginated,
    offset,
  });

  const totalCount = await db.$count(
    models.queries,
    whereConditions.length > 0 ? and(...whereConditions) : undefined
  );

  return res.data('Queries retrieved successfully', queries, {
    page,
    size,
    total: totalCount,
  });
});

export const getQuery = serviceHandler(idParamSchema, async (req, res) => {
  const { id } = req.params;

  const query = await db.query.queries.findFirst({
    where: eq(models.queries.id, id),
    with: {
      category: {
        columns: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
  });

  if (!query) {
    throw new ApiError('Query not found', 404);
  }

  return res.success('Query retrieved successfully', query);
});

export const updateProfile = serviceHandler(updateProfileSchema, async (req, res) => {
  const {
    name,
    dob,
    profession,
    ppsNo,
    address,
    eircode,
    phone,
    maritalStatus: currentMaritalStatus,
    spouse,
  } = req.body;
  const user = req.user;
  const isProduction = process.env.NODE_ENV === 'production';

  // Generate trigram hashes for user data
  const ppsNumberTrigramHashes = hashTrigrams(ppsNo);
  const nameTrigramHashes = hashTrigrams(name.toLowerCase());
  const phoneTrigramHashes = hashTrigrams(phone);
  const professionTrigramHashes = hashTrigrams(profession.toLowerCase());

  // Check if user PPS number conflicts with another user using exact matching
  const ppsConflict = await db.query.users.findFirst({
    where: and(
      sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
        ppsNumberTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
        ppsNumberTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      not(eq(models.users.id, user.id)),
      isNull(models.users.deletedAt)
    ),
  });
  if (ppsConflict) {
    throw new ApiError('There is already an account with the provided PPS Number.', 400);
  }

  // Check if user phone conflicts with another user using exact matching
  const phoneConflict = await db.query.users.findFirst({
    where: and(
      sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
        phoneTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
        phoneTrigramHashes.map((h) => sql`${h}`),
        sql`, `
      )}]::text[]`,
      not(eq(models.users.id, user.id)),
      isNull(models.users.deletedAt)
    ),
  });
  if (phoneConflict) {
    throw new ApiError('There is already an account with the provided phone number.', 400);
  }

  let existingSpouse = null;
  let filters: (SQL | undefined)[] = [];

  // If user is a parent (parentId is null), find child as spouse
  if (!user.parentId) {
    filters.push(eq(models.users.parentId, user.id));
    filters.push(isNull(models.users.deletedAt));
  } else {
    // If user is a child (has parentId), find parent as spouse
    filters.push(eq(models.users.id, user.parentId));
    filters.push(isNull(models.users.deletedAt));
  }

  // Get current spouse if exists
  existingSpouse = await db.query.users.findFirst({
    where: and(...filters),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      ppsNumber: true,
      dob: true,
      profession: true,
      address: true,
      eircode: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      isTaxAgentVerificationCompleted: true,
    },
  });

  let updatedUserData = null;
  let updatedSpouseData = null;

  await db.transaction(async (tx) => {
    // Update main user
    const [updatedUser] = await tx
      .update(models.users)
      .set({
        name,
        nameTrigramHashes,
        ppsNumberTrigramHashes,
        professionTrigramHashes,
        dob,
        profession,
        ppsNumber: ppsNo,
        address,
        eircode,
        phone,
        phoneTrigramHashes,
        maritalStatus: currentMaritalStatus,
        parentId:
          (currentMaritalStatus != user.maritalStatus &&
            (user.maritalStatus === 'married' || user.maritalStatus === 'civil_partnership'))
            ? (currentMaritalStatus === 'married' || currentMaritalStatus === 'civil_partnership'
              ? user.parentId
              : null)
            : user.parentId,
      })
      .where(eq(models.users.id, user.id))
      .returning({
        id: models.users.id,
        name: models.users.name,
        email: models.users.email,
        phone: models.users.phone,
        ppsNumber: models.users.ppsNumber,
        dob: models.users.dob,
        profession: models.users.profession,
        address: models.users.address,
        eircode: models.users.eircode,
        maritalStatus: models.users.maritalStatus,
        status: models.users.status,
      });

    updatedUserData = updatedUser;

    // Handle marital status changes
    if (
      user.maritalStatus !== currentMaritalStatus &&
      (currentMaritalStatus === 'single' ||
        currentMaritalStatus === 'divorced' ||
        currentMaritalStatus === 'widowed' ||
        currentMaritalStatus === 'separated' ||
        currentMaritalStatus === 'married_spouse_abroad')
    ) {
      // Changing from married to single, divorced, widowed, separated, civil partnership, or married spouse abroad - unlink spouse
      if (existingSpouse) {
        let spouseMaritalStatus = 'single';
        if (currentMaritalStatus == 'divorced' || currentMaritalStatus == 'separated') {
          spouseMaritalStatus = currentMaritalStatus;
        }
        await tx
          .update(models.users)
          .set({ parentId: null, maritalStatus: spouseMaritalStatus })
          .where(eq(models.users.id, existingSpouse.id));
      }
    } else if ((currentMaritalStatus === 'married' || currentMaritalStatus === 'civil_partnership') && spouse) {
      // User wants to be married or in civil partnership and provided spouse details

      // Validate spouse data based on existing spouse status
      if (existingSpouse) {
        // User already has a spouse - validate update permissions

        // Always allow: name, dob, profession, address, eircode
        const allowedUpdates: Partial<typeof models.users.$inferInsert> = {
          name: spouse.name,
          nameTrigramHashes: hashTrigrams(spouse.name.toLowerCase()),
          dob: spouse.dob,
          profession: spouse.profession,
          professionTrigramHashes: hashTrigrams(spouse.profession.toLowerCase()),
          address: spouse.address,
          eircode: spouse.eircode,
          maritalStatus: currentMaritalStatus,
        };

        // Email validation: allow update only if current email is not verified
        if (spouse.email) {
          if (!existingSpouse.emailVerifiedAt) {
            // Check if new email conflicts with other users using exact matching
            const spouseEmailTrigramHashes = hashTrigrams(spouse.email.toLowerCase());
            const emailConflict = await tx.query.users.findFirst({
              where: and(
                sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
                  spouseEmailTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
                  spouseEmailTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[]`,
                not(eq(models.users.id, existingSpouse.id)),
                isNull(models.users.deletedAt)
              ),
            });
            if (emailConflict) {
              throw new ApiError('Spouse email already exists with another account', 409);
            }
            allowedUpdates.email = spouse.email;
            allowedUpdates.emailTrigramHashes = spouseEmailTrigramHashes;
          } else if (spouse.email !== existingSpouse.email) {
            throw new ApiError('Cannot update spouse email - email is already verified', 400);
          }
        }

        // Phone validation: allow update only if current phone is not verified
        if (spouse.phone) {
          if (!existingSpouse.phoneVerifiedAt) {
            // Check if new phone conflicts with other users using exact matching
            const spousePhoneTrigramHashes = hashTrigrams(spouse.phone);
            const phoneConflict = await tx.query.users.findFirst({
              where: and(
                sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
                  spousePhoneTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
                  spousePhoneTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[]`,
                not(eq(models.users.id, existingSpouse.id)),
                isNull(models.users.deletedAt)
              ),
            });
            if (phoneConflict) {
              throw new ApiError('Spouse phone number already exists with another account', 409);
            }
            allowedUpdates.phone = spouse.phone;
            allowedUpdates.phoneTrigramHashes = spousePhoneTrigramHashes;
          } else if (spouse.phone !== existingSpouse.phone) {
            throw new ApiError('Cannot update spouse phone - phone is already verified', 400);
          }
        }

        // PPS Number validation: allow update only if agent activation is not completed
        if (spouse.ppsNo) {
          if (!existingSpouse.isTaxAgentVerificationCompleted) {
            // Check if new PPS conflicts with other users using exact matching
            const spousePpsTrigramHashes = hashTrigrams(spouse.ppsNo);
            const ppsConflict = await tx.query.users.findFirst({
              where: and(
                sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
                  spousePpsTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
                  spousePpsTrigramHashes.map((h) => sql`${h}`),
                  sql`, `
                )}]::text[]`,
                ne(models.users.id, existingSpouse.id),
                isNull(models.users.deletedAt)
              ),
            });
            if (ppsConflict) {
              throw new ApiError('Spouse PPS number already exists with another account', 409);
            }
            allowedUpdates.ppsNumber = spouse.ppsNo;
            allowedUpdates.ppsNumberTrigramHashes = spousePpsTrigramHashes;
          } else if (spouse.ppsNo !== existingSpouse.ppsNumber) {
            throw new ApiError(
              'Cannot update spouse PPS number - agent activation is completed',
              400
            );
          }
        }

        // Update existing spouse
        const [updatedSpouse] = await tx
          .update(models.users)
          .set(allowedUpdates)
          .where(eq(models.users.id, existingSpouse.id))
          .returning({
            id: models.users.id,
            name: models.users.name,
            email: models.users.email,
            phone: models.users.phone,
            ppsNumber: models.users.ppsNumber,
            dob: models.users.dob,
            profession: models.users.profession,
            address: models.users.address,
            eircode: models.users.eircode,
            emailVerifiedAt: models.users.emailVerifiedAt,
            phoneVerifiedAt: models.users.phoneVerifiedAt,
            isTaxAgentVerificationCompleted: models.users.isTaxAgentVerificationCompleted,
          });

        // Handle spouse password update if provided
        if (spouse.password) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(spouse.password, salt);
          await tx
            .update(models.users)
            .set({
              password: hashedPassword,
              passwordSetAt: dateToString(new Date()),
            })
            .where(eq(models.users.id, existingSpouse.id));
        }

        updatedSpouseData = {
          ...updatedSpouse,
          isEmailVerified: !!updatedSpouse.emailVerifiedAt,
          isPhoneVerified: !!updatedSpouse.phoneVerifiedAt,
        };
      } else {
        // No existing spouse - create new spouse record

        // Generate trigram hashes for all spouse data
        const spouseEmailTrigramHashes = hashTrigrams(spouse.email!.toLowerCase());
        const spousePhoneTrigramHashes = hashTrigrams(spouse.phone!);
        const spousePpsTrigramHashes = hashTrigrams(spouse.ppsNo!);
        const spouseNameTrigramHashes = hashTrigrams(spouse.name.toLowerCase());
        const spouseProfessionTrigramHashes = hashTrigrams(spouse.profession.toLowerCase());

        // Check for conflicts with existing users using exact matching
        const conflicts = await Promise.all([
          tx.query.users.findFirst({
            where: and(
              sql`${models.users.emailTrigramHashes} @> ARRAY[${sql.join(
                spouseEmailTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[] AND ${models.users.emailTrigramHashes} <@ ARRAY[${sql.join(
                spouseEmailTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(models.users.deletedAt)
            ),
          }),
          tx.query.users.findFirst({
            where: and(
              sql`${models.users.phoneTrigramHashes} @> ARRAY[${sql.join(
                spousePhoneTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[] AND ${models.users.phoneTrigramHashes} <@ ARRAY[${sql.join(
                spousePhoneTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(models.users.deletedAt)
            ),
          }),
          tx.query.users.findFirst({
            where: and(
              sql`${models.users.ppsNumberTrigramHashes} @> ARRAY[${sql.join(
                spousePpsTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[] AND ${models.users.ppsNumberTrigramHashes} <@ ARRAY[${sql.join(
                spousePpsTrigramHashes.map((h) => sql`${h}`),
                sql`, `
              )}]::text[]`,
              isNull(models.users.deletedAt)
            ),
          }),
        ]);

        const [emailConflict, phoneConflict, ppsConflict] = conflicts;

        if (emailConflict) {
          throw new ApiError('Spouse email already exists with another account', 409);
        }
        if (phoneConflict) {
          throw new ApiError('Spouse phone number already exists with another account', 409);
        }
        if (ppsConflict) {
          throw new ApiError('Spouse PPS number already exists with another account', 409);
        }

        // Create new spouse record with trigram hashes
        const [newSpouse] = await tx
          .insert(models.users)
          .values({
            parentId: user.id,
            name: spouse.name,
            email: spouse.email!,
            emailTrigramHashes: spouseEmailTrigramHashes,
            phone: spouse.phone!,
            phoneTrigramHashes: spousePhoneTrigramHashes,
            ppsNumber: spouse.ppsNo!,
            ppsNumberTrigramHashes: spousePpsTrigramHashes,
            nameTrigramHashes: spouseNameTrigramHashes,
            professionTrigramHashes: spouseProfessionTrigramHashes,
            dob: spouse.dob,
            profession: spouse.profession,
            address: spouse.address,
            eircode: spouse.eircode,
            maritalStatus: currentMaritalStatus,
            status: true,
            isPrimaryAccount: false,
            isEmailOtpVerified: true,
            emailVerifiedAt: dateToString(new Date()),
            isPhoneOtpVerified: false,
            // Store hashed password if provided
            ...(spouse.password ? {
              password: await bcrypt.hash(spouse.password, await bcrypt.genSalt(10)),
              passwordSetAt: dateToString(new Date()),
            } : {}),
            // Use same policy IDs as main user
            privacyPolicyId: user.privacyPolicyId,
            cookiePolicyId: user.cookiePolicyId,
            feeStructureId: user.feeStructureId,
            termsAndConditionId: user.termsAndConditionId,
            isSignatureConsentCompleted: process.env.NODE_ENV !== 'production',
          })
          .returning({
            id: models.users.id,
            name: models.users.name,
            email: models.users.email,
            phone: models.users.phone,
            ppsNumber: models.users.ppsNumber,
            dob: models.users.dob,
            profession: models.users.profession,
            address: models.users.address,
            eircode: models.users.eircode,
            emailVerifiedAt: models.users.emailVerifiedAt,
            phoneVerifiedAt: models.users.phoneVerifiedAt,
            isTaxAgentVerificationCompleted: models.users.isTaxAgentVerificationCompleted,
          });

        if (isProduction) {
          // Send e-signature request to new spouse
          await sendSignatureRequest({ name: newSpouse.name, email: newSpouse.email });
        }

        updatedSpouseData = {
          ...newSpouse,
          isEmailVerified: !!newSpouse.emailVerifiedAt,
          isPhoneVerified: !!newSpouse.phoneVerifiedAt,
        };
      }
    }
  });

  const responseData = {
    ...updatedUserData!,
    spouse: updatedSpouseData,
  };

  return res.success('Profile updated successfully', responseData);
});

// Note: These functions need to be implemented based on new schema requirements
// export const uploadProfilePhoto = serviceHandler(emptySchema, async () => {
//   throw new ApiError('Profile photo upload functionality needs to be updated for new schema');
// });

// export const subscribeToFcmTopic = serviceHandler(emptySchema, async () => {
//   throw new ApiError('FCM topic subscription functionality needs to be updated for new schema');
// });

// export const unsubscribeFromFcmTopic = serviceHandler(emptySchema, async () => {
//   throw new ApiError('FCM topic unsubscription functionality needs to be updated for new schema');
// });

//Admin-only: endpoint to mark users where admins requested their agent activation in ROS
export const updateUserActivationStatus = serviceHandler(
  updateActivationStatusSchema,
  async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await db.query.users.findFirst({
      where: and(isNull(models.users.deletedAt), eq(models.users.id, userId)),
    });

    if (!user) throw new ApiError('User not found', 404);

    const now = dateToString(new Date());
    let updateData: any = {};

    if (status === 'ros_not_updated') {
      updateData = {
        isTaxAgentVerificationRequestSent: false,
        taxAgentVerificationRequestSentAt: null,
        isTaxAgentVerificationCompleted: false,
        taxAgentVerificationCompletedAt: null,
      };
    } else if (status === 'ros_updated') {
      updateData = {
        isTaxAgentVerificationRequestSent: true,
        taxAgentVerificationRequestSentAt: now,
        isTaxAgentVerificationCompleted: false,
        taxAgentVerificationCompletedAt: null,
      };
    } else if (status === 'agent_activated') {
      updateData = {
        isTaxAgentVerificationRequestSent: true, // If activated, request must have been sent
        isTaxAgentVerificationCompleted: true,
        taxAgentVerificationCompletedAt: now,
      };
    }

    await db.update(models.users).set(updateData).where(eq(models.users.id, userId));

    return res.success('User activation status updated successfully', {});
  }
);

export const toggleAgentActivationRequestStatus = serviceHandler(
  userIdBodySchema,
  async (req, res) => {
    const userId = req.body.userId;

    const user = await db.query.users.findFirst({
      where: and(isNull(models.users.deletedAt), eq(models.users.id, userId)),
      columns: {
        id: true,
        isTaxAgentVerificationRequestSent: true,
        taxAgentVerificationRequestSentAt: true,
      },
    });

    if (!user) throw new ApiError('User not found', 404);

    if (!user.isTaxAgentVerificationRequestSent) {
      await db
        .update(models.users)
        .set({
          isTaxAgentVerificationRequestSent: true,
          taxAgentVerificationRequestSentAt: dateToString(new Date()),
        })
        .where(eq(models.users.id, userId));
    } else {
      await db
        .update(models.users)
        .set({
          isTaxAgentVerificationRequestSent: false,
          taxAgentVerificationRequestSentAt: null,
        })
        .where(eq(models.users.id, userId));
    }

    return res.success('User agent activation request status updated successfully', {});
  }
);

export const updateUserRemark = serviceHandler(updateUserRemarkSchema, async (req, res) => {
  const { userId } = req.params;
  const { remark } = req.body;

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
  });

  if (!user) throw new ApiError('User not found', 404);

  await db
    .update(models.users)
    .set({
      remark,
      updatedAt: new Date(),
    })
    .where(eq(models.users.id, userId));

  return res.success('Remark updated successfully');
});

export const pairUser = serviceHandler(pairUserSchema, async (req, res) => {
  const { primaryUserId, spouseUserId } = req.body;

  if (primaryUserId === spouseUserId) {
    throw new ApiError('Cannot pair a user with themselves', 400);
  }

  const [primaryUser, spouseUser] = await Promise.all([
    db.query.users.findFirst({ where: eq(models.users.id, primaryUserId) }),
    db.query.users.findFirst({ where: eq(models.users.id, spouseUserId) }),
  ]);

  if (!primaryUser || !spouseUser) {
    throw new ApiError('One or both users not found', 404);
  }

  await db.transaction(async (tx) => {
    // Update primary user
    await tx
      .update(models.users)
      .set({
        parentId: null,
        isJointAssessment: true,
        updatedAt: new Date(),
      })
      .where(eq(models.users.id, primaryUserId));

    // Update spouse user
    await tx
      .update(models.users)
      .set({
        parentId: primaryUserId,
        isJointAssessment: true,
        isPrimaryAccount: false,
        updatedAt: new Date(),
      })
      .where(eq(models.users.id, spouseUserId));

    // Log the pairing activity
    await tx.insert(models.activityLogs).values({
      modifiedUserId: req.admin.id,
      entityName: activityLogEntityNames.user,
      entityId: primaryUserId,
      action: 'update',
      newData: {
        spouseUserId,
        description: `Paired user ${primaryUser.email} with ${spouseUser.email} for joint assessment`,
      },
    });
  });

  return res.success('Users paired successfully for joint assessment');
});

export const unpairUser = serviceHandler(unpairUserSchema, async (req, res) => {
  const { userId } = req.params;

  const user = await db.query.users.findFirst({
    where: eq(models.users.id, userId),
    columns: {
      id: true,
      email: true,
      parentId: true,
      isJointAssessment: true,
    },
  });

  if (!user) throw new ApiError('User not found', 404);

  let primaryUserId: string;
  let spouseUserId: string;

  if (user.parentId) {
    // User is the spouse; parent is the primary
    primaryUserId = user.parentId;
    spouseUserId = user.id;
  } else {
    // User is the primary; find the spouse
    primaryUserId = user.id;
    const spouse = await db.query.users.findFirst({
      where: and(eq(models.users.parentId, user.id), isNull(models.users.deletedAt)),
      columns: { id: true, email: true },
    });

    // If no parent link and no flag, then throw the Error
    if (!spouse && !user.isJointAssessment) {
      throw new ApiError('User is not in a joint assessment', 400);
    }

    // If flag is set but no spouse found, just clear the flag on primary
    if (!spouse) {
      await db.update(models.users).set({ isJointAssessment: false }).where(eq(models.users.id, user.id));
      return res.success('Joint assessment flag cleared');
    }

    spouseUserId = spouse.id;
  }

  // Fetch both users for activity log
  const [primaryUser, spouseUser] = await Promise.all([
    db.query.users.findFirst({ where: eq(models.users.id, primaryUserId), columns: { id: true, email: true } }),
    db.query.users.findFirst({ where: eq(models.users.id, spouseUserId), columns: { id: true, email: true } }),
  ]);

  await db.transaction(async (tx) => {
    // Remove joint assessment from primary user
    await tx
      .update(models.users)
      .set({
        isJointAssessment: false,
        updatedAt: new Date(),
      })
      .where(eq(models.users.id, primaryUserId));

    // Remove joint assessment and parent link from spouse user
    await tx
      .update(models.users)
      .set({
        parentId: null,
        isJointAssessment: false,
        isPrimaryAccount: true,
        updatedAt: new Date(),
      })
      .where(eq(models.users.id, spouseUserId));

    // Log the unpairing activity
    await tx.insert(models.activityLogs).values({
      modifiedUserId: req.admin.id,
      entityName: activityLogEntityNames.user,
      entityId: primaryUserId,
      action: 'update',
      newData: {
        spouseUserId,
        description: `Unpaired user ${primaryUser?.email} from ${spouseUser?.email} (joint assessment removed)`,
      },
    });
  });

  return res.success('Users unpaired successfully');
});

export const searchProfessions = serviceHandler(searchProfessionSchema, async (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.success('Professions retrieved', []);
  }

  // Hash the search keyword's trigrams
  try {
    const searchHashes = hashTrigrams(keyword.toLowerCase());
    
    // Require at least partial match
    const minMatches = Math.ceil(searchHashes.length * 0.4);

    const results = await db
      .select({
        profession: models.users.profession,
      })
      .from(models.users)
      .where(
        and(
          isNull(models.users.deletedAt),
          sql`(
            SELECT COUNT(*)
            FROM UNNEST(${models.users.professionTrigramHashes}) AS t1
            WHERE t1 = ANY(ARRAY[${sql.join(
              searchHashes.map((h) => sql`${h}`),
              sql`, `
            )}]::text[])
          ) >= ${minMatches}`
        )
      )
      .limit(100);

    // Decrypting is handled by drizzle custom type mapping
    const uniqueProfessionsSet = new Set();
    results.forEach((r) => {
      if (r.profession) {
         // Case-insensitive normalization
         uniqueProfessionsSet.add(r.profession.trim());
      }
    });
    
    const uniqueProfessions = Array.from(uniqueProfessionsSet);
    
    return res.success('Professions retrieved', uniqueProfessions);
  } catch (error) {
    console.error('Error searching professions:', error);
    return res.success('Professions retrieved', []);
  }
});
