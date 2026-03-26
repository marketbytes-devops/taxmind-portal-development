import { NextFunction, Request, Response } from 'express';

import { AdminWithRole, UserWithProfilePhoto } from '@/types';
import ApiError from '@/utils/apiError';

import { decodeJwt, loadUserByRole } from './helper';

declare global {
  namespace Express {
    interface Request {
      user: UserWithProfilePhoto;
      admin: AdminWithRole;
    }
  }
}

export const authorize =
  (...roles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req?.headers?.authorization?.split(' ')?.[1];
    if (!token && !roles.includes('PUBLIC')) throw new ApiError('Unauthorized', 401);

    if (token) {
      const decoded = decodeJwt(token) as TokenPayload;
      if (!decoded.type) throw new ApiError('Unauthorized', 401);
      if (roles.includes(decoded.type)) await loadUserByRole(decoded.type, decoded, req);
    }

    if (roles.includes('PUBLIC')) return next();

    const { user, admin } = req;
    // console.log({ user });

    if (!(admin || user)) throw new ApiError('Unauthorized', 401);

    next();
  };
