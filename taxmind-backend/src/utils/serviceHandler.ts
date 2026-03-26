/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
import { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

export function serviceHandler<T extends z.ZodType>(
  schema: T,
  handler: (
    req: Omit<Request, keyof z.output<T>> & z.output<T>,
    res: Response,
    next: NextFunction
  ) => void | Promise<void>
): (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function serviceHandler(
  handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>
): (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function serviceHandler<T extends z.ZodType>(
  schemaOrHandler: T | ((req: Request, res: Response, next: NextFunction) => void | Promise<void>),
  handler?: (req: Request, res: Response, next: NextFunction) => void | Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (handler) {
        const schema = schemaOrHandler as T;
        const parsedData = schema.parse(req);
        // Safely assign the parsed/transformed data back to the request object
        // Handle read-only properties like req.query separately
        for (const [key, value] of Object.entries(parsedData as Record<string, any>)) {
          if (key === 'query') {
            // For query, merge the properties instead of replacing the whole object
            Object.assign(req.query, value);
          } else {
            // For other properties, assign directly
            (req as any)[key] = value;
          }
        }
        await handler(req, res, next);
      } else {
        const handler = schemaOrHandler as (
          req: Request,
          res: Response,
          next: NextFunction
        ) => void | Promise<void>;
        await handler(req, res, next);
      }
    } catch (error) {
      console.error('Error in serviceHandler:', error);
      next(error);
    }
  };
}
