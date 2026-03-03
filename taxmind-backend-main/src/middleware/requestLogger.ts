import type { NextFunction, Request, Response } from 'express';

import logger from '@/logger/index';

/**
 * @param {import("express").Request} req
 */
function requestLogger(req: Request, res: Response, next: NextFunction) {
  logger.info(`[${req.method}] ${req.originalUrl}`);
  next();
}

export default requestLogger;
