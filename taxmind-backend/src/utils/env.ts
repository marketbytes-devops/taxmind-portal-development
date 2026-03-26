import { ZodError, z } from 'zod';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}

const configSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['local', 'development', 'staging', 'production']),
  PORT: z
    .string()
    .regex(/^\d{4,5}$/)
    .default('5000'),

  // Database
  DATABASE_URL: z
    .url()
    .refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      'DATABASE_URL must be a valid postgresql url'
    ),

  // Auth
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRE: z.string(), // e.g., 7d
  JWT_REFRESH_TOKEN_EXPIRE: z.string(), // e.g., 30d

  // Email / Support
  SUPPORT_EMAIL_ID: z.email(),

  // AWS S3
  AWS_S3_BUCKET_NAME: z.string(),
  AWS_ACCESS_KEY: z.string(),
  AWS_SECRET_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_URL: z.url().refine((url) => url.startsWith('https://'), 'Invalid AWS_S3_URL'),
  S3_SIGNED_URL_EXPIRY: z.coerce.number().int().positive().default(86400),

  // Crypto keys (GDPR)
  HMAC_SECRET_KEY: z.string(),
  ENCRYPTION_SECRET_KEY: z.string(),

  // Admin UI
  ADMIN_DASHBOARD_BASE_URL: z
    .url()
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), 'Invalid ADMIN_DASHBOARD_BASE_URL'),

  // Zoho Sign OAuth
  ZOHO_CLIENT_ID: z.string(),
  ZOHO_CLIENT_SECRET: z.string(),
  ZOHO_AUTHORIZED_REDIRECT_URL: z.string(),
  ZOHO_ACCOUNTS_URL: z.url(),
  ZOHO_SIGN_URL: z.url(),
  ZOHO_REFRESH_TOKEN: z.string(),
  ZOHO_TEMPORARY_ACCESS_TOKEN: z.string().optional(),
  ZOHO_TEMPLATE_ID: z.string(),
  ZOHO_WEBHOOK_SECRET: z.string(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_SERVICE_SID: z.string(),

  // Revolut
  REVOLUT_API_SECRET_KEY: z.string(),
  REVOLUT_API_PUBLIC_KEY: z.string(),
  REVOLUT_API: z.url(),
  REVOLUT_WEBHOOK_URL: z.url(),
  REVOLUT_ENV: z.enum(['sandbox', 'production']).default('sandbox'),

  // End-User UI
  USER_DASHBOARD_BASE_URL: z
    .url()
    .refine((url) => url.startsWith('http://') || url.startsWith('https://'), 'Invalid USER_DASHBOARD_BASE_URL'),

  // WhatsApp Business API
  WA_BASE_URL: z.url().refine((url) => url.startsWith('http://') || url.startsWith('https://'), 'Invalid WA_BASE_URL'),
  WA_MOBILE_NUMBER_ID: z.string(),
  WA_API_TOKEN: z.string(),
  WA_WEBHOOK_VERIFY_TOKEN: z.string(),
});

type Env = z.infer<typeof configSchema>;

export const createEnv = () => {
  try {
    configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) console.error(error.message);
    process.exit(1);
  }
};
