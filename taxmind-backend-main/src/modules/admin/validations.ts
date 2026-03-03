import { z } from 'zod';

const emailValidator = z
  .string({ message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' });

const signinPasswordValidator = z.string({ message: 'Password is required' });

const signupPasswordValidator = z
  .string({ message: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter (A-Z)' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter (a-z)' })
  .regex(/[0-9]/, { message: 'Password must contain at least one digit (0-9)' })
  .regex(/[!@#$&*~]/, {
    message: 'Password must contain at least one special character (!,@,#,$,&,*,~)',
  });

export const signInSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: signinPasswordValidator,
  }),
});

export const registerNewUserSchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }),
    email: emailValidator,
    roleId: z.string({ message: 'Role is required' }).uuid({ message: 'Invalid role' }),
  }),
});

export const emailVerificationCodeSchema = z.object({
  body: z.object({
    email: emailValidator,
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: emailValidator,
    otp: z.number({ message: 'OTP is required' }),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ message: 'Current password is required' }),
    newPassword: signupPasswordValidator,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: emailValidator,
    otp: z.number({ message: 'OTP is required' }),
    newPassword: signupPasswordValidator,
  }),
});

export const getAccessTokenSchema = z.object({
  body: z.object({
    email: emailValidator,
  }),
});

export const updateAdminStatusSchema = z.object({
  params: z.object({ adminId: z.string().uuid() }),
  body: z.object({
    status: z.boolean({ message: 'Status is required' }),
  }),
});

export const listReportsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().nonnegative().optional(),
      size: z.coerce.number().int().nonnegative().optional(),
      startDate: z
        .string()
        .transform((str) => new Date(str))
        .refine((date) => !isNaN(date.getTime()), {
          message: 'Invalid start date format. Expected format is YYYY-MM-DD.',
        })
        .optional(),
      endDate: z
        .string()
        .transform((str) => new Date(str))
        .refine((date) => !isNaN(date.getTime()), {
          message: 'Invalid end date format. Expected format is YYYY-MM-DD.',
        })
        .optional(),
      keyword: z.string().optional(),
    })
    .strict(),
});
