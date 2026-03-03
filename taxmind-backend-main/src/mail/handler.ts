import { sendMail } from '../integrations/awsSES';

interface MailHandlerParams {
  recipient: string;
  replacements: { [x: string]: unknown };
}

export const mail = {
  verifyEmail: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your TaxMind verification code',
      templateName: 'email-otp',
      replacements,
    });
  },

  welcomeEmail: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Welcome to Taxmind',
      templateName: 'welcome',
      replacements,
    });
  },

  agentActivationCompleted: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Taxmind Agent is Now Active',
      templateName: 'agent_activation_completed',
      replacements,
    });
  },

  termsAndConditions: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Taxmind Terms and Conditions',
      templateName: 'terms_and_condition',
      replacements,
    });
  },

  applicationReview: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Application is Under Review',
      templateName: 'application_review',
      replacements,
    });
  },

  filingCompleted: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Filing Completed by Your Agent',
      templateName: 'filing_completed',
      replacements,
    });
  },

  offboardUser: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Account Offboarding Confirmation',
      templateName: 'offboard_users',
      replacements,
    });
  },

  offlinePaymentRejected: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Offline Payment Not Approved',
      templateName: 'payment_not_approved',
      replacements,
    });
  },

  refundCompleted: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Refund Payment is Completed',
      templateName: 'refund_completed',
      replacements,
    });
  },

  documentRejected: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Applied Document is Rejected',
      templateName: 'document_rejected',
      replacements,
    });
  },

  paymentReminder: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Payment Reminder for Your Recent Tax Filing',
      templateName: 'payment_reminder',
      replacements,
    });
  },

  taxAgentRequest: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Approve Your Agent Request on ROS Portal',
      templateName: 'tax_agent_request',
      replacements,
    });
  },

  newAdminAccount: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Welcome to Taxmind! Your Account is Ready',
      templateName: 'new_admin_account',
      replacements,
    });
  },

  paymentReceived: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Payment is Received',
      templateName: 'payment_received',
      replacements,
    });
  },
  paymentFailed: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Your Payment has been Failed',
      templateName: 'payment_failed',
      replacements,
    });
  },
  applicationSubmitted: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'New Application Submitted',
      templateName: 'application_submitted',
      replacements,
    });
  },
  additionalDocumentRequest: async function ({ recipient, replacements }: MailHandlerParams) {
    await sendMail({
      recipient,
      subject: 'Request for Additional Documents',
      templateName: 'additional_doc_request',
      replacements,
    });
  },
};
