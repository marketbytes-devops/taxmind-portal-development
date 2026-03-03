import { notificationTypes } from '@/constants';

export const notificationTemplates = {
  // Authentication & Onboarding
  verifyEmail: {
    title: `Verify Your Email`,
    body: `Please verify your email address to complete your registration with TaxMind.`,
    type: notificationTypes.verifyEmail.key,
  },
  welcomeEmail: {
    title: `Welcome to TaxMind!`,
    body: `Your account has been successfully created. Start your tax filing journey with us today.`,
    type: notificationTypes.welcomeEmail.key,
  },

  // Agent & Application Status
  agentActivationCompleted: {
    title: `Agent Activation Complete`,
    body: `Great news! Your TaxMind agent is now active and ready to assist with your tax filing.`,
    type: notificationTypes.agentActivationCompleted.key,
  },
  taxAgentRequest: {
    title: `Action Required: Approve Agent Request`,
    body: `Please approve your agent request on the ROS Portal to continue with your tax filing.`,
    type: notificationTypes.taxAgentRequest.key,
  },
  applicationSubmitted: {
    title: `New Application Submitted`,
    body: `A new tax application (No: APP_NO) has been submitted and requires your review.`,
    type: notificationTypes.applicationSubmitted.key,
  },
  applicationReview: {
    title: `Application Under Review`,
    body: `Your tax application (No: APP_NO) is currently being reviewed by our team. We'll notify you once it's complete.`,
    type: notificationTypes.applicationReview.key,
  },
  reviewCompleted: {
    title: `Application Review Completed By Tax-Agent`,
    body: `Your application (No: APP_NO) has been reviewed by the tax agent and is now ready for the filing process.`,
    type: notificationTypes.reviewCompleted.key,
  },
  filingCompleted: {
    title: `Tax Filing Complete`,
    body: `Your agent has successfully completed the tax filing for your application (No: APP_NO). Your refund details are now available.`,
    type: notificationTypes.filingCompleted.key,
  },

  // Document Management
  documentRejected: {
    title: `Document Rejected`,
    body: `One or more of your submitted documents have been rejected. Please review and resubmit.`,
    type: notificationTypes.documentRejected.key,
  },
  additionalDocumentRequest: {
    title: `Additional Documents Required`,
    body: `We need additional documents to process your application. Please upload them at your earliest convenience.`,
    type: notificationTypes.additionalDocumentRequest.key,
  },

  // Payment Related
  paymentFailed: {
    title: `Payment Failed`,
    body: `Your online payment for application (No: APP_NO) could not be completed. Please try again.`,
    type: notificationTypes.paymentFailed.key,
  },
  paymentSuccessful: {
    title: `Payment Successful`,
    body: `Your online payment for application (No: APP_NO) was successful. Thank you for your payment.`,
    type: notificationTypes.paymentReceived.key,
  },
  paymentReminder: {
    title: `Payment Reminder`,
    body: `Your payment is pending. Please complete the payment to finalize your tax filing.`,
    type: notificationTypes.paymentReminder.key,
  },
  offlinePaymentRejected: {
    title: `Offline Payment Request Rejected`,
    body: `Your offline payment request for application (No: APP_NO) has been rejected. Please check the details and try again.`,
    type: notificationTypes.offlinePaymentRejected.key,
  },
  offlinePaymentAccepted: {
    title: `Offline Payment Request Approved`,
    body: `Your offline payment request for application (No: APP_NO) has been approved.`,
    type: notificationTypes.offlinePaymentAccepted.key,
  },

  // Refund Related
  refundCompleted: {
    title: `Refund Completed`,
    body: `The tax refund for your application (No: APP_NO) has been completed and is being processed.`,
    type: notificationTypes.refundCompleted.key,
  },

  // Account Management
  termsAndConditions: {
    title: `Terms and Conditions Updated`,
    body: `Our terms and conditions have been updated. Please review them in your account settings.`,
    type: notificationTypes.termsAndConditions.key,
  },
  offboardUser: {
    title: `Account Offboarding Confirmed`,
    body: `Your account offboarding request has been confirmed. We're sorry to see you go.`,
    type: notificationTypes.offboardUser.key,
  },
  newAdminAccount: {
    title: `Admin Account Created`,
    body: `Welcome to TaxMind! Your admin account has been created successfully.`,
    type: notificationTypes.newAdminAccount.key,
  },
  customerSupportMessageReceived: {
    title: `New Message in Customer Support Chat`,
    body: `You have received a new message from USER_NAME via the customer support chat.`,
    type: notificationTypes.customerSupportMessageReceived.key,
  },
  applicationSupportMessageReceived: {
    title: `New Message in Application Chat Support`,
    body: `You have received a new message from USER_NAME regarding application No: APP_NO.`,
    type: notificationTypes.applicationSupportMessageReceived.key,
  },
};
