import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import logger from '@/logger';

import * as dbModels from './models';

// Set up the database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'local' ? false : { rejectUnauthorized: false, requestCert: true },
  max: 100, // Maximum number of connections in the pool
  idleTimeoutMillis: 200000, // Time to close idle connections
  connectionTimeoutMillis: 1000000, // Time to wait for a connection
});

// Connect to the database and return a drizzle instance.
export const db = drizzle(pool, {
  schema: dbModels,
  casing: 'snake_case',
  logger: process.env.NODE_ENV !== 'production',
});

export const models = dbModels;

export const checkDbConnection = async () => {
  try {
    // Attempt to get a client connection from the pool
    const client = await pool.connect();
    logger.info('Database connection established successfully.');

    // Release the client back to the pool
    client.release();
    return true;
  } catch (error) {
    logger.error('Failed to establish database connection');
    logger.error(error);
    return false;
  }
};
