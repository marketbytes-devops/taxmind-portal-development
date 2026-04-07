import { Request } from 'express';
import jwt from 'jsonwebtoken';

import logger from '@/logger';
import ApiError from '@/utils/apiError';

import { getAdmin, getUser } from './db';

export const roleHandlers = {
  ADMIN: getAdmin,
  USER: getUser,
  PUBLIC: () => true,
};

export const loadUserByRole = async (role: Role, decoded: TokenPayload, req: Request) => {
  const handler = roleHandlers[role];
  return await handler(decoded, req);
};

export const decodeJwt = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') throw new ApiError('Unauthorized', 401);
    logger.error((error as Error).message);
    throw new ApiError('Unauthorized', 401);
  }
};
