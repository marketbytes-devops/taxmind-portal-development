import { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/apiError';

declare global {
  namespace Express {
    interface Request {
      pagination: Pagination;
    }
  }
}

export const paginate = (req: Request, res: Response, next: NextFunction) => {
  const { page, size } = req.query;

  // Validate numeric
  if ((page && isNaN(+page)) || (size && isNaN(+size))) {
    throw new ApiError('pagination values, page and size must be numbers');
  }

  // Coerce and enforce 1-based indexing (page >= 1, size >= 1)
  const parsedPage = page ? Number(page) : 1;
  const parsedSize = size ? Number(size) : 10;

  if (parsedPage < 1 || parsedSize < 1) {
    throw new ApiError('pagination values, page and size must be >= 1');
  }

  const limit = parsedSize;
  const offset = (parsedPage - 1) * limit;

  req.pagination = {
    limit,
    offset,
    page: parsedPage,
    size: parsedSize,
  };
  next();
};
