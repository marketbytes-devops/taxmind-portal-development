import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';

const uuidSchema = z.string().uuid({ message: 'Invalid ID format' });

// Comprehensive phone number validator and formatter using libphonenumber-js
const phoneValidator = z
  .string({ message: 'Phone number is required' })
  .min(1, 'Phone number cannot be empty')
  .refine((val) => val.trim().length > 0, { message: 'Phone number cannot be empty' })
  .refine(
    (val) => {
      try {
        // Try to parse the phone number with Ireland as default country
        const phoneNumber = parsePhoneNumberFromString(val, 'IE');

        // Check if the phone number is valid
        return phoneNumber && phoneNumber.isValid();
      } catch (error) {
        console.error('Phone number parsing error:', error);
        return false;
      }
    },
    {
      message: 'Please enter a valid Irish phone number',
    }
  )
  .transform((val) => {
    // After validation, transform to E.164 format for database storage
    const phoneNumber = parsePhoneNumberFromString(val, 'IE');
    return phoneNumber!.number; // Returns E.164 format (e.g., "+353871234567")
  });
// .transform((val) => {
//   // Ensure the phone number starts with '+'
//   if (!val.startsWith('+')) {
//     return `+${val}`;
//   } else {
//     return val;
//   }
// })
const emailValidator = z.email({ message: 'Please enter a valid email address' });

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

export const maritalStatusSchema = z.enum([
  'single',
  'married',
  'widowed',
  'divorced',
  'separated',
  'civil_partnership',
  'married_spouse_abroad',
]);

// Name validator - no special characters allowed, only letters, spaces, hyphens, and apostrophes
const nameValidator = z
  .string({ message: 'Name is required' })
  .min(1, 'Name cannot be empty')
  .refine((val) => val.trim().length > 0, { message: 'Name cannot be empty' })
  .refine(
    (val) => {
      // Allow only letters, spaces, hyphens, and apostrophes
      const namePattern = /^[a-zA-Z\s\-']+$/;
      return namePattern.test(val.trim());
    },
    {
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    }
  );

// Eircode validator - 7-digit alphanumeric format
const eircodeValidator = z
  .string({ message: 'Eircode is required' })
  .min(1, 'Eircode cannot be empty')
  .refine((val) => val.trim().length > 0, { message: 'Eircode cannot be empty' })
  .refine(
    (val) => {
      // Irish Eircode format: 7 characters (alphanumeric)
      // Format: A65 F4E2 (3 chars + space + 4 chars, but we'll accept with or without space)
      const cleaned = val.replace(/\s/g, '').toUpperCase();
      const eircodePattern = /^[A-Z0-9]{7}$/;
      return eircodePattern.test(cleaned);
    },
    {
      message: 'Eircode must be 7 alphanumeric characters.',
    }
  )
  .transform((val) => {
    // Normalize format: remove spaces and convert to uppercase
    return val.replace(/\s/g, '').toUpperCase();
  });

// DOB validator with exact format validation (DD/MM/YYYY)
const dobValidator = z
  .string({ message: 'Date of birth is required' })
  .min(1, 'Date of birth cannot be empty')
  .refine((val) => val.trim().length > 0, { message: 'Date of birth cannot be empty' })
  .refine(
    (val) => {
      // Check exact format: DD/MM/YYYY
      const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      return dobPattern.test(val.trim());
    },
    {
      message: 'Date of birth must be in DD/MM/YYYY format',
    }
  )
  .refine(
    (val) => {
      // Validate actual date values
      const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = val.trim().match(dobPattern);

      if (!match) return false;

      const [, day, month, year] = match;
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      // Basic range checks
      if (dayNum < 1 || dayNum > 31) return false;
      if (monthNum < 1 || monthNum > 12) return false;
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;

      // Create date object and verify it's valid
      const date = new Date(yearNum, monthNum - 1, dayNum);
      return (
        date.getFullYear() === yearNum &&
        date.getMonth() === monthNum - 1 &&
        date.getDate() === dayNum
      );
    },
    {
      message: 'Please enter a valid date of birth (DD/MM/YYYY)',
    }
  )
  .refine(
    (val) => {
      // Check if date is in the past
      const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = val.trim().match(dobPattern);

      if (!match) return false;

      const [, day, month, year] = match;
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();

      // Set today's time to end of day to allow today's date
      today.setHours(23, 59, 59, 999);

      return birthDate < today;
    },
    {
      message: 'Date of birth must be in the past',
    }
  )
  .refine(
    (val) => {
      // Check if person is at least 16 years old
      const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = val.trim().match(dobPattern);

      if (!match) return false;

      const [, day, month, year] = match;
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const today = new Date();

      // Calculate age
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 16;
    },
    {
      message: 'You must be at least 16 years old to register',
    }
  )
  .transform((val) => {
    // Transform to ISO date (YYYY-MM-DD) for database storage
    const dobPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = val.trim().match(dobPattern);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
    return val;
  });

const spouseSchema = z.object({
  name: nameValidator,
  email: z
    .string({ message: 'Spouse email is required' })
    .email('Please enter a valid email address for spouse'),
  phone: phoneValidator,
  dob: dobValidator,
  profession: z
    .string({ message: 'Spouse profession is required' })
    .min(1, 'Spouse profession cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse profession cannot be empty' }),
  ppsNo: z
    .string({ message: 'Spouse PPS Number is required' })
    .min(1, 'Spouse PPS Number cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse PPS Number cannot be empty' })
    .refine(
      (val) => {
        // Remove spaces and convert to uppercase for validation
        const cleaned = val.replace(/\s/g, '').toUpperCase();

        // Check basic format: 7 digits followed by 1 or 2 letters
        const ppsPattern = /^(\d{7})([A-Z]{1,2})$/;
        const match = cleaned.match(ppsPattern);

        if (!match) return false;

        const [, , letters] = match;

        // Validate letters format
        if (letters.length === 1) {
          // Old format: single letter A-Z
          return /^[A-Z]$/.test(letters);
        } else if (letters.length === 2) {
          // New format (since 2013): first letter is check digit, second letter A-I or W
          const checkLetter = letters[0];
          const suffixLetter = letters[1];

          // First letter can be any A-Z (check digit)
          // Second letter must be A-I or W
          return /^[A-Z]$/.test(checkLetter) && /^[A-IW]$/.test(suffixLetter);
        }

        return false;
      },
      {
        message: 'Please enter a valid Irish PPS Number for spouse',
      }
    )
    .transform((val) => {
      // Normalize format: remove spaces and convert to uppercase
      return val.replace(/\s/g, '').toUpperCase();
    }),
  address: z
    .string({ message: 'Spouse address is required' })
    .min(1, 'Spouse address cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse address cannot be empty' }),
  eircode: eircodeValidator,
  password: signupPasswordValidator,
});

export const signUpSchema = z.object({
  body: z
    .object({
      name: nameValidator,
      email: z.string({ message: 'Email is required' }).email('Please enter a valid email address'),
      password: z
        .string({ message: 'Password is required' })
        .min(8, 'Password must be at least 8 characters long'),
      phone: phoneValidator,
      dob: dobValidator,
      profession: z
        .string({ message: 'Profession is required' })
        .min(1, 'Profession cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'Profession cannot be empty' }),
      ppsNo: z
        .string({ message: 'PPS Number is required' })
        .min(1, 'PPS Number cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'PPS Number cannot be empty' })
        .refine(
          (val) => {
            // Remove spaces and convert to uppercase for validation
            const cleaned = val.replace(/\s/g, '').toUpperCase();

            // Check basic format: 7 digits followed by 1 or 2 letters
            const ppsPattern = /^(\d{7})([A-Z]{1,2})$/;
            const match = cleaned.match(ppsPattern);

            if (!match) return false;

            const [, , letters] = match;

            // Validate letters format
            if (letters.length === 1) {
              // Old format: single letter A-Z
              return /^[A-Z]$/.test(letters);
            } else if (letters.length === 2) {
              // New format (since 2013): first letter is check digit, second letter A-I or W
              const checkLetter = letters[0];
              const suffixLetter = letters[1];

              // First letter can be any A-Z (check digit)
              // Second letter must be A-I or W
              return /^[A-Z]$/.test(checkLetter) && /^[A-IW]$/.test(suffixLetter);
            }

            return false;
          },
          {
            message: 'Please enter a valid Irish PPS Number',
          }
        )
        .transform((val) => {
          // Normalize format: remove spaces and convert to uppercase
          return val.replace(/\s/g, '').toUpperCase();
        }),
      address: z
        .string({ message: 'Address is required' })
        .min(1, 'Address cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'Address cannot be empty' }),
      eircode: eircodeValidator,
      maritalStatus: maritalStatusSchema,
      spouse: spouseSchema.optional(),
    })
    .refine((val) => (val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership' ? !!val.spouse : true), {
      message: 'Spouse details required for married or civil partnership users',
      path: ['spouse'],
    })
    .refine(
      (val) => {
        if ((val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership') && val.spouse) {
          return val.email !== val.spouse.email;
        }
        return true;
      },
      {
        message: 'User and spouse cannot have the same email address',
        path: ['spouse', 'email'],
      }
    )
    .refine(
      (val) => {
        if ((val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership') && val.spouse) {
          return val.ppsNo !== val.spouse.ppsNo;
        }
        return true;
      },
      {
        message: 'User and spouse cannot have the same PPS number',
        path: ['spouse', 'ppsNo'],
      }
    )
    .refine(
      (val) => {
        if ((val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership') && val.spouse) {
          // Both phone numbers will be transformed to have '+' prefix by the phoneValidator
          // We can directly compare the normalized phone numbers
          return val.phone !== val.spouse.phone;
        }
        return true;
      },
      {
        message: 'User and spouse cannot have the same phone number',
        path: ['spouse', 'phone'],
      }
    )
    .refine(
      (val) =>
        val.maritalStatus === 'single' ||
          val.maritalStatus === 'divorced' ||
          val.maritalStatus === 'widowed'
          ? !val.spouse
          : true,
      {
        message: 'Spouse details should not be provided for single, divorced, or widowed users',
        path: ['spouse'],
      }
    ),
});

export const unbindSpouseSchema = z.object({
  body: z.object({
    reason: z.string().min(1).optional(), // optional audit note
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: emailValidator,
    password: signinPasswordValidator,
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
    otp: z.union([z.string(), z.number()], { message: 'OTP must be a valid string or number' }),
  }),
});

export const phoneVerificationCodeSchema = z.object({
  body: z.object({
    phone: phoneValidator,
  }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: phoneValidator,
    otp: z.union([z.string(), z.number()], { message: 'OTP must be a valid string or number' }),
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
    otp: z.union([z.string(), z.number()], { message: 'OTP must be a valid string or number' }),
    newPassword: signupPasswordValidator,
  }),
});

// Schema for getUserDetails
export const getUserDetailsSchema = z.object({
  params: z.object({
    userId: z.string({ message: 'User ID is required' }),
  }),
});

export const getAccessTokenSchema = z.object({
  body: z.object({
    email: emailValidator,
  }),
});

export const listUserSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().nonnegative().optional(),
      size: z.coerce.number().int().nonnegative().optional(),
      sortBy: z.enum(['createdAt', 'updatedAt']).optional(),
      orderBy: z.enum(['asc', 'desc']).optional(),
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
      status: z
        .enum([
          'pending',
          'active',
          'terminated',
          'unverified',
          'agent_activated',
          'agent_not_activated',
          'ros_not_updated',
          'ros_updated',
          'offboard',
          'return',
          'joint_assessment',
        ])
        .optional(),
      profession: z.string().optional(),
    })
    .strict(),
});
export const offBoardedUsersListSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().nonnegative().optional(),
      size: z.coerce.number().int().nonnegative().optional(),
      sortBy: z.enum(['deletedAt', 'updatedAt']).optional(),
      orderBy: z.enum(['asc', 'desc']).optional(),
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

// Admin-only: upload agent activation records (CSV -> JSON array)
// Expected structure: { noticeNo, customerName, regnTraderNo, documentType, issuedDate, ... }
export const agentActivationUploadSchema = z.object({
  body: z
    .array(
      z.object({
        noticeNo: z.string().optional(),
        customerName: z.string().optional(),
        regnTraderNo: z
          .string({ message: 'Registration/Trader number is required' })
          .min(1, 'Registration/Trader number is required'),
        mandatoryEFiler: z.string().optional(),
        taxTypeDutyRep: z.string().optional(),
        documentType: z.string().optional(),
        periodBegin: z.string().optional(),
        issuedDate: z.string().optional(),
        archivedBy: z.string().optional(),
      })
    )
    .min(1, { message: 'At least one record is required' }),
});

export const listAgentActivationSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().nonnegative().optional(),
      size: z.coerce.number().int().nonnegative().optional(),
    })
    .strict(),
});

// Public: Submit a user query/contact message
export const submitQuerySchema = z.object({
  body: z.object({
    name: z.string({ message: 'Name is required' }).min(1, 'Name cannot be empty'),
    email: emailValidator,
    message: z.string({ message: 'Message is required' }).min(1, 'Message cannot be empty'),
    categoryId: uuidSchema,
  }),
});

// Queries Validations (for listing user queries)
export const listQueriesSchema = z.object({
  query: z.object({
    categoryId: uuidSchema.optional(),
    page: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
    limit: z
      .string()
      .transform((val) => parseInt(val))
      .optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const userIdBodySchema = z.object({
  body: z.object({
    userId: uuidSchema,
  }),
});

// Enhanced spouse schema for profile updates with conditional fields
const updateSpouseSchema = z.object({
  name: nameValidator,
  email: z
    .string({ message: 'Spouse email is required' })
    .email('Please enter a valid email address for spouse')
    .optional(),
  phone: phoneValidator.optional(),
  dob: dobValidator,
  profession: z
    .string({ message: 'Spouse profession is required' })
    .min(1, 'Spouse profession cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse profession cannot be empty' }),
  ppsNo: z
    .string({ message: 'Spouse PPS Number is required' })
    .min(1, 'Spouse PPS Number cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse PPS Number cannot be empty' })
    .refine(
      (val) => {
        // Remove spaces and convert to uppercase for validation
        const cleaned = val.replace(/\s/g, '').toUpperCase();

        // Check basic format: 7 digits followed by 1 or 2 letters
        const ppsPattern = /^(\d{7})([A-Z]{1,2})$/;
        const match = cleaned.match(ppsPattern);

        if (!match) return false;

        const [, , letters] = match;

        // Validate letters format
        if (letters.length === 1) {
          // Old format: single letter A-Z
          return /^[A-Z]$/.test(letters);
        } else if (letters.length === 2) {
          // New format (since 2013): first letter is check digit, second letter A-I or W
          const checkLetter = letters[0];
          const suffixLetter = letters[1];

          // First letter can be any A-Z (check digit)
          // Second letter must be A-I or W
          return /^[A-Z]$/.test(checkLetter) && /^[A-IW]$/.test(suffixLetter);
        }

        return false;
      },
      {
        message: 'Please enter a valid Irish PPS Number for spouse',
      }
    )
    .transform((val) => {
      // Normalize format: remove spaces and convert to uppercase
      return val.replace(/\s/g, '').toUpperCase();
    })
    .optional(),
  password: signupPasswordValidator.nullable().optional(),
  address: z
    .string({ message: 'Spouse address is required' })
    .min(1, 'Spouse address cannot be empty')
    .refine((val) => val.trim().length > 0, { message: 'Spouse address cannot be empty' }),
  eircode: eircodeValidator,
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: nameValidator,
      dob: dobValidator,
      profession: z
        .string({ message: 'Profession is required' })
        .min(1, 'Profession cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'Profession cannot be empty' }),
      ppsNo: z
        .string({ message: 'PPS Number is required' })
        .min(1, 'PPS Number cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'PPS Number cannot be empty' })
        .refine(
          (val) => {
            // Remove spaces and convert to uppercase for validation
            const cleaned = val.replace(/\s/g, '').toUpperCase();

            // Check basic format: 7 digits followed by 1 or 2 letters
            const ppsPattern = /^(\d{7})([A-Z]{1,2})$/;
            const match = cleaned.match(ppsPattern);

            if (!match) return false;

            const [, , letters] = match;

            // Validate letters format
            if (letters.length === 1) {
              // Old format: single letter A-Z
              return /^[A-Z]$/.test(letters);
            } else if (letters.length === 2) {
              // New format (since 2013): first letter is check digit, second letter A-I or W
              const checkLetter = letters[0];
              const suffixLetter = letters[1];

              // First letter can be any A-Z (check digit)
              // Second letter must be A-I or W
              return /^[A-Z]$/.test(checkLetter) && /^[A-IW]$/.test(suffixLetter);
            }

            return false;
          },
          {
            message: 'Please enter a valid Irish PPS Number.',
          }
        )
        .transform((val) => {
          // Normalize format: remove spaces and convert to uppercase
          return val.replace(/\s/g, '').toUpperCase();
        }),
      address: z
        .string({ message: 'Address is required' })
        .min(1, 'Address cannot be empty')
        .refine((val) => val.trim().length > 0, { message: 'Address cannot be empty' }),
      eircode: eircodeValidator,
      phone: phoneValidator,
      maritalStatus: maritalStatusSchema,
      spouse: updateSpouseSchema.optional(),
    })
    .refine((val) => (val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership' ? !!val.spouse : true), {
      message: 'Spouse details required for married or civil partnership users',
      path: ['spouse'],
    })
    .refine(
      (val) => {
        if ((val.maritalStatus === 'married' || val.maritalStatus === 'civil_partnership') && val.spouse) {
          return val.ppsNo !== val.spouse.ppsNo;
        }
        return true;
      },
      {
        message: 'User and spouse cannot have the same PPS number',
        path: ['spouse', 'ppsNo'],
      }
    )
    .refine(
      (val) =>
        val.maritalStatus === 'single' ||
          val.maritalStatus === 'divorced' ||
          val.maritalStatus === 'widowed'
          ? !val.spouse
          : true,
      {
        message: 'Spouse details should not be provided for single, divorced, or widowed users',
        path: ['spouse'],
      }
    ),
});
export const reactivateAccountSchema = z.object({
  body: z.object({
    email: emailValidator,
  }),
});

export const updateUserRemarkSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  body: z.object({
    remark: z.string().max(500),
  }),
});
export const pairUserSchema = z.object({
  body: z.object({
    primaryUserId: uuidSchema,
    spouseUserId: uuidSchema,
  }),
});

export const unpairUserSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
});
export const updateActivationStatusSchema = z.object({
  params: z.object({
    userId: uuidSchema,
  }),
  body: z.object({
    status: z.enum(['ros_not_updated', 'ros_updated', 'agent_activated']),
  }),
});

export const searchProfessionSchema = z.object({
  query: z.object({
    keyword: z.string().optional(),
  }),
});
