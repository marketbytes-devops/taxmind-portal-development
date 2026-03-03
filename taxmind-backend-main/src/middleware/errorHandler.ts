/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { fromError } from 'zod-validation-error';

import logger from '@/logger';
import ApiError from '@/utils/apiError';
import type HttpException from '@/utils/httpException';
import { prettifyZodMessage } from '@/utils/prettifyZodMessage';

export const standardErrorHandler = (
  error: HttpException,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  // logger.error(
  //   JSON.stringify({
  //     error_message: error.message,
  //     tags: 'error',
  //     additionalInfo: { ...error },
  //   })
  // );

  if (error?.code === 'LIMIT_FILE_SIZE') return response.error(error.message, 413);

  // check if response has already been sent
  if (response.headersSent) {
    logger.error(JSON.stringify({ error_message: '[Error] Sent already:', error }));
    return;
  }

  //check cutom errors
  if (error instanceof ApiError) return response.error(error.msg(), error.statusCode());

  if (error instanceof ZodError) {
    const validationError = fromError(error, {
      includePath: true,
      maxIssuesInMessage: 1,
    });
    const raw =
      typeof validationError.toString === 'function'
        ? validationError.toString()
        : String((validationError as unknown as { message?: string }).message || validationError);
    const message = prettifyZodMessage(raw);
    return response.error(message, 400);
  }

  // fail safe
  // console.error("[Error] Unhandled:", error);
  logger.error(JSON.stringify(error));
  return response.serverError();
};
