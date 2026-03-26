import twilio, { Twilio } from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

import logger from '@/logger';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID, TWILIO_FROM_NUMBER } =
  process.env;

let twilioClient: Twilio | null = null;

const getClient = (): Twilio => {
  if (!twilioClient) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are not configured');
    }
    // Lazy-load subresources only when first accessed
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, { lazyLoading: true });
  }
  return twilioClient;
};

export interface SendOtpSmsParams {
  phoneNumber: string;
  otp: string;
  template?: string;
}

// Default OTP message template
const DEFAULT_TEMPLATE = 'Your verification code for taxmind is {{otp}}. It expires in 10 minutes.';

const buildMessageBody = (otp: string, template?: string) =>
  (template || DEFAULT_TEMPLATE).replace(/{{\s*otp\s*}}/gi, otp);

export const sendOtpSms = async ({ phoneNumber, otp, template }: SendOtpSmsParams) => {
  try {
    if (!TWILIO_FROM_NUMBER) throw new Error('TWILIO_FROM_NUMBER is not configured');
    if (!phoneNumber) throw new Error('phoneNumber is required');
    if (!otp) throw new Error('otp is required');

    const client = getClient();
    const body = buildMessageBody(otp, template);

    const params: MessageListInstanceCreateOptions = {
      body,
      to: phoneNumber,
      from: TWILIO_FROM_NUMBER,
    };
    const result = await client.messages.create(params);

    return { success: true, sid: result.sid, status: result.status, to: result.to };
  } catch (error) {
    logger.error('Twilio SMS send error:', (error as Error).message || error);
    return { success: false, error: (error as Error).message || 'Failed to send OTP SMS' };
  }
};

export const verifyPhone = async (phone: string) => {
  if (process.env.NODE_ENV !== 'production') return { success: true, error: null };

  try {
    if (!TWILIO_SERVICE_SID) throw new Error('TWILIO_SERVICE_SID is not configured');
    const client = getClient();
    const verification = await client.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verifications.create({ to: phone, channel: 'sms' });
    return { success: true, sid: verification.sid, status: verification.status };
  } catch (error) {
    console.log(error);
    logger.error(`Twilio verifyPhone error: ${(error as Error).message || error}`);
    return { success: false, error: (error as Error).message || 'Failed to start verification' };
  }
};

export const checkVerification = async ({ phone, otp }: { phone: string; otp: string }) => {
  if (process.env.NODE_ENV !== 'production')
    return { success: true, status: 'approved', valid: true };

  try {
    if (!TWILIO_SERVICE_SID) throw new Error('TWILIO_SERVICE_SID is not configured');
    const client = getClient();
    const verification = await client.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verificationChecks.create({ to: phone, code: otp });
    return {
      success: true,
      status: verification.status,
      valid: verification.status === 'approved',
    };
  } catch (error) {
    console.log(error);
    logger.error(`Twilio checkVerification error: ${(error as Error).message || error}`);
    return { success: false, error: (error as Error).message || 'Verification check failed' };
  }
};
