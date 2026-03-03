import http from 'http';

import { createTerminus } from '@godaddy/terminus';

import logger from '@/logger';
import { initSocket } from '@/modules/chat/socket';
import { createEnv } from '@/utils/env';
import '@/utils/objectPolyfill';
import { terminusOptions } from '@/utils/terminus';

import app from './app';
import { checkDbConnection } from './database';
import { initializeCronJobs } from './scripts/cronScheduler';

async function startServer() {
  createEnv();
  checkDbConnection();

  // Get host from environment and store in Express
  // const host = process.env.HOST || '0.0.0.0';

  const PORT = process.env.PORT || 5000;

  app.set('port', PORT);
  // app.set('host', host);

  // Create HTTP server
  const server = http.createServer(app);

  createTerminus(server, terminusOptions);

  // Initialize socket
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`🚀 [${process.env.NODE_ENV}] Listening on ${PORT}`);

    // Initialize Cron jobs
    try {
      initializeCronJobs();
      logger.info('✅ Cron jobs initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize cron jobs:', error);
    }
  });

  // Catch Unhandled Promise Rejections
  process.on('unhandledRejection', (error) => {
    logger.error(
      JSON.stringify({
        error_message: `Unhandled rejection detected: ${(error as Error).message}`,
        tags: 'error',
        additionalInfo: error,
      })
    );
  });

  // Catch Uncaught Exceptions
  process.on('uncaughtException', (error) => {
    logger.error(
      JSON.stringify({
        error_message: `Uncaught exception: ${(error as Error).message}`,
        tags: 'error',
        additionalInfo: error,
      })
    );
    process.exit(1); // Exit the process to avoid undefined state
  });
}

export default startServer;
