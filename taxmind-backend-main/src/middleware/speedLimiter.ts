import slowDown from 'express-slow-down';

export const speedLimiter = slowDown({
  windowMs: 5 * 60 * 1000, // 5 minutes
  delayAfter: 50, // allow 50 requests per 3 minutes, then start slowing down responses
  delayMs: (hits) => hits * 100, // add 100ms delay per request over the limit
});
