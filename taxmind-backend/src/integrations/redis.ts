// import IORedis from 'ioredis';

// import logger from '@/logger';

// export const redisConnection = new IORedis({
//   maxRetriesPerRequest: null,
//   host: process.env.REDIS_HOST as string,
//   port: process.env.REDIS_PORT as unknown as number,
//   password: process.env.REDIS_PASSWORD as string,
//   username: process.env.REDIS_USERNAME as string,
// });

// // Listen for the 'connect' event
// redisConnection.on('connect', () => {
//   logger.info('> Successfully connected to the Redis');
// });

// // Listen for the 'ready' event (Redis is fully ready for commands)
// redisConnection.on('ready', () => {
//   logger.info('> Redis is ready to accept commands');
// });

// // Handle redisConnection errors
// redisConnection.on('error', (err) => {
//   logger.error('> Error connecting to Redis:', err.message);
// });

// // Handle reconnecting attempts
// redisConnection.on('reconnecting', () => {
//   logger.info('> Reconnecting to Redis...');
// });
