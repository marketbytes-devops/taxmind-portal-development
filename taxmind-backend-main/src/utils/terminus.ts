import os from 'os';

import { TerminusOptions } from '@godaddy/terminus';

import { checkDbConnection, pool } from '@/database';
import logger from '@/logger';
import { stopCronJobs } from '@/scripts/cronScheduler';

function formatUptime(uptime: number) {
  const days = Math.floor(uptime / (24 * 60 * 60));
  const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatMemoryUsage(memoryUsage: NodeJS.MemoryUsage) {
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  return {
    rss: `${toMB(memoryUsage.rss)} MB`, // Resident Set Size
    heapTotal: `${toMB(memoryUsage.heapTotal)} MB`, // Total heap size
    heapUsed: `${toMB(memoryUsage.heapUsed)} MB`, // Used heap size
    external: `${toMB(memoryUsage.external)} MB`, // External memory used
  };
}

function formatCpuLoad(loadAvg: number[]) {
  return {
    '1min': loadAvg[0].toFixed(2),
    '5min': loadAvg[1].toFixed(2),
    '15min': loadAvg[2].toFixed(2),
  };
}

// Health Check Function
async function onHealthCheck() {
  // Check database connection
  const dbConnectionStatus = await checkDbConnection();
  // console.log({ dbConnectionStatus });
  if (!dbConnectionStatus)
    return {
      status: 'failed',
      db: 'not connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      cpuLoad: os.loadavg(),
    };
  return {
    status: 'ok',
    db: 'connected',
    uptime: formatUptime(process.uptime()),
    timestamp: new Date().toISOString(),
    memoryUsage: formatMemoryUsage(process.memoryUsage()),
    cpuLoad: formatCpuLoad(os.loadavg()),
  };
}

// Signal Cleanup (runs when shutdown signals are received)
async function onSignal() {
  logger.info('Received shutdown signal, cleaning up...');

  // Stop GDPR compliance cron jobs first
  try {
    stopCronJobs();
    logger.info('✅ Cron jobs stopped successfully');
  } catch (error) {
    logger.error('❌ Error stopping cron jobs:', error);
  }

  // Close database connection
  await pool.end();
  logger.info('✅ DB connection closed successfully');
  logger.info('🔄 Cleanup finished, server is shutting down...');
}

// Shutdown Function (called just before the server closes)
async function beforeShutdown() {
  logger.info('Starting graceful shutdown...');
  // return new Promise((resolve) => setTimeout(resolve, 5000)); // Grace period of 5 seconds
}

// Terminus Options
export const terminusOptions: TerminusOptions = {
  signals: ['SIGINT', 'SIGTERM'], // Signals for graceful shutdown
  healthChecks: {
    '/health': onHealthCheck, // Endpoint for health checks
    verbatim: true, // Provides more detailed info in health check response
  },
  timeout: 10000, // 10-second timeout for graceful shutdown
  onSignal, // Signal handling logic
  beforeShutdown, // Time delay before shutting down the server
  onShutdown: async () => {
    logger.info('Server fully shut down');
  },
};
