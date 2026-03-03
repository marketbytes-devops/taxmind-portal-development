import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

import logger from '@/logger';
import ApiError from '@/utils/apiError';

async function key(kid: string) {
  const client = jwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
    timeout: 30000,
  });

  return await client.getSigningKey(kid);
}

export const verifyAppleLogin = async (idToken: string) => {
  try {
    const payload = jwt.decode(idToken, {
      complete: true,
    });

    // console.log(true, payload);

    if (!payload) throw new ApiError('Apple login error. Unable to verify token');

    const kid = payload.header.kid;
    if (!kid) throw new ApiError('Apple login error. Unable to verify token');

    const publicKey = (await key(kid)).getPublicKey();
    // console.log(publicKey);

    const { sub, email } = jwt.verify(idToken, publicKey) as { sub: string; email: string };
    return { sub, email };
  } catch (error) {
    // console.log(JSON.stringify(error, null, 2));
    logger.error((error as Error).message);
    throw new ApiError('Apple login error. Unable to verify token');
  }
};
