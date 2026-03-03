export const allowedOrigins = {
  local: '*',
  development: '*',
  staging: ['https://staging-app.com', /^http:\/\/localhost:\d+$/, 'https://hoppscotch.io'],
  production: ['https://taxmind.ie', 'https://admin.taxmind.ie'],
};

export const DEFAULT_MQ_REMOVE_CONFIG = {
  // removeOnComplete: {
  //   age: 3600,
  // },
  removeOnComplete: true,
  removeOnFail: {
    age: 24 * 3600,
  },
};

export const INVITE_CODE = 'W4D6ZA477UPK';

export const webhookUrls = [
  '/api/v1/users/payments/webhook',
  // '/api/v1/users/esign/webhook',
  // '/api/v1/applications/payments/webhook',
];

export const REDIS_DEFAULT_EXPIRATION = 3600; // in seconds. current 1 hr

export const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

export const notificationTypes = {
  // Authentication & Onboarding
  verifyEmail: { key: 'verify_email', category: 'authentication' },
  welcomeEmail: { key: 'welcome_email', category: 'authentication' },

  // Agent & Application
  agentActivationCompleted: { key: 'agent_activation_completed', category: 'application' },
  taxAgentRequest: { key: 'tax_agent_request', category: 'application' },
  applicationSubmitted: { key: 'application_submitted', category: 'application' },
  applicationReview: { key: 'application_review', category: 'application' },
  reviewCompleted: { key: 'review_completed', category: 'application' },
  filingCompleted: { key: 'filing_completed', category: 'application' },

  // Document Management
  documentRejected: { key: 'document_rejected', category: 'document' },
  additionalDocumentRequest: { key: 'additional_document_request', category: 'document' },

  // Payment
  paymentFailed: { key: 'payment_failed', category: 'payment' },
  paymentReceived: { key: 'payment_received', category: 'payment' },
  paymentReminder: { key: 'payment_reminder', category: 'payment' },
  offlinePaymentRejected: { key: 'offline_payment_rejected', category: 'payment' },
  offlinePaymentAccepted: { key: 'offline_payment_accepted', category: 'payment' },

  // Refund
  refundCompleted: { key: 'refund_completed', category: 'refund' },

  // Account
  termsAndConditions: { key: 'terms_and_conditions', category: 'account' },
  offboardUser: { key: 'offboard_user', category: 'account' },
  newAdminAccount: { key: 'new_admin_account', category: 'account' },

  // Customer Support
  customerSupportMessageReceived: { key: 'customer_support_message_received', category: 'customer_support' },

  // Application Support
  applicationSupportMessageReceived: { key: 'application_support_message_received', category: 'application' },
};

export const notificationTypesArr = Object.values(notificationTypes).map((v) => v.key);

export const loginTypes = {
  email: 'EMAIL',
  facebook: 'FACEBOOK',
  google: 'GOOGLE',
  apple: 'APPLE',
};

export const loginTypesArr = Object.values(loginTypes).map((v) => v);

export const activityLogEntityNames = Object.freeze({
  user: 'user',
  role: 'role',
  admin: 'admin',
  notification: 'notification',
  application_note: 'application-note',
  application_review: 'application-review',
  blog: 'blog',
  question: 'question',
  question_category: 'question-category',
  questionnaire: 'questionnaire',
});

export const activityLogEntityNamesArr = Object.values(activityLogEntityNames).map((_) => _);

export const namePrefixes = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Other'] as const;

export const genderTypes = [
  'Male',
  'Female',
  'Non-binary',
  // 'Prefer to self-describe',
  'Prefer not to say',
  'Other',
] as const;

export const policyTypes = {
  PRIVACY_POLICY: 'privacy_policy',
  COOKIES_POLICY: 'cookies_policy',
  FEE_STRUCTURE: 'fee_structure',
  TERMS_CONDITIONS: 'terms_and_condition',
};

export const policyTypesArr = Object.values(policyTypes).map((_) => _);

export const maritalStatuses = {
  MARRIED: 'married',
  SINGLE: 'single',
  DIVORCED: 'divorced',
  WIDOWED: 'widowed',
  CIVIL_PARTNERSHIP: 'civil_partnership',
  MARRIED_SPOUSE_ABROAD: 'married_spouse_abroad',
  SEPARATED: 'separated',
};
export const maritalStatusesArr = Object.values(maritalStatuses).map((_) => _);

export const categoryType = {
  DOCUMENT: 'document',
  QUERY: 'query',
};
export const categoryTypesArr = Object.values(categoryType).map((_) => _);

export const applicationStatuses = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  DOCUMENTS_UPLOAD_PENDING: 'documents_upload_pending',
  DOCUMENTS_UPLOADED: 'documents_uploaded',
  DOCUMENTS_VERIFIED: 'documents_verified',
  REVIEWED: 'reviewed',
  PROCESSING: 'processing',
  REFUND_COMPLETED: 'refund_completed',
};
export const applicationStatusesArr = Object.values(applicationStatuses).map((_) => _);

export const currentSteps = {
  INITIAL_REVIEW_AND_ENQUIRY: 'initial_review_and_enquiry',
  DOCUMENTS_UPLOAD: 'documents_upload',
  AGENT_ACTIVATION: 'agent_activation',
  REVIEW: 'review',
  DOCUMENTS_UPLOAD_REVIEW: 'documents_upload_review',
  PROCESSING: 'processing',
  REFUND_COMPLETED: 'refund_completed',
};
export const currentStepsArr = Object.values(currentSteps).map((_) => _);

export const stepKeys = {
  QUESTIONNAIRE: 'questionnaire',
  DOCUMENTS: 'documents',
  AGENT_ACTIVATION: 'agent_activation',
  REVIEW: 'review',
  PROCESSING: 'processing',
  REFUND: 'refund',
};
export const stepKeysArr = Object.values(stepKeys).map((_) => _);

export const paymentMethods = {
  REVOLUT: 'revolut',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  CHEQUE: 'cheque',
  OTHER: 'other',
};
export const paymentMethodsArr = Object.values(paymentMethods).map((_) => _);

export const paymentStatuses = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  // REFUNDED: 'refunded',
  // DISPUTED: 'disputed',
};
export const paymentStatusesArr = Object.values(paymentStatuses).map((_) => _);

export const offlinePaymentStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
export const offlinePaymentStatusesArr = Object.values(offlinePaymentStatuses).map((_) => _);

export const documentRejectedReasons = [
  'Document is blurry or unclear',
  'Incorrect document type uploaded',
  'Partial or cropped document',
  'Fake or tampered document',
  'Multiple documents in one upload',
  'Back side of document missing',
  'Watermark or editing detected',
];
