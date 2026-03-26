import { OAuth2Client } from 'google-auth-library';

import logger from '@/logger';
import ApiError from '@/utils/apiError';

const oauthClient = new OAuth2Client();

const GOOGLE_CLIENT_IDS_ANDROID = JSON.parse(process.env.GOOGLE_CLIENT_IDS_ANDROID!);
const GOOGLE_CLIENT_IDS_IOS = JSON.parse(process.env.GOOGLE_CLIENT_IDS_IOS!);
const GOOGLE_CLIENT_IDS_WEB = JSON.parse(process.env.GOOGLE_CLIENT_IDS_WEB!);

const GOOGLE_CLIENT_IDS = [
  GOOGLE_CLIENT_IDS_ANDROID,
  GOOGLE_CLIENT_IDS_IOS,
  GOOGLE_CLIENT_IDS_WEB,
].flat();

export const verifyGoogleLogin = async (idToken: string, origin: TOrigin) => {
  console.log({ origin });
  try {
    const response = await oauthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_IDS,
    });

    const payload = response.getPayload();
    // console.log(payload);
    return payload;
  } catch (error) {
    logger.error((error as Error).message);
    throw new ApiError('Google login error. Unable to verify token');
  }
};
