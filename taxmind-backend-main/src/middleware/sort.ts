import { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/apiError';

declare global {
  namespace Express {
    interface Request {
      sort: string[];
    }
  }
}

export const sort = (req: Request, res: Response, next: NextFunction) => {
  const { sortBy, orderBy } = req.query;

  let order = ['createdAt', 'desc'];

  if (sortBy && orderBy) {
    if (!isNaN(+sortBy) || !isNaN(+orderBy))
      throw new ApiError('sort values, sortBy and orderBy must be strings');

    if (typeof orderBy !== 'string') throw new ApiError('orderBy must be string');
    if (typeof sortBy !== 'string') throw new ApiError('sortBy must be string');

    if (!['desc', 'asc'].includes(orderBy))
      throw new ApiError("orderBy should be either 'desc' or 'asc'");

    if (orderBy.toLowerCase() !== 'asc' && orderBy.toLowerCase() !== 'desc')
      throw new ApiError("invalid orderBy key. orderBy should be either 'desc' or 'asc'");

    order = [sortBy, orderBy];
  }

  req.sort = order;
  next();
};
