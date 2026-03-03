require('module-alias/register');
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import * as dbModels from '@/database/models';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

if (!process.env.DATABASE_MIGRATION_FOLDER) {
  throw new Error('DATABASE_MIGRATION_FOLDER is not set in environment variables');
}

// Set up the database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'local' ? false : { rejectUnauthorized: false, requestCert: true },
});

// Connect to the database and return a drizzle instance.
export const db = drizzle(pool, {
  schema: dbModels,
  casing: 'snake_case',
  logger: process.env.NODE_ENV !== 'production',
});

(async function () {
  await migrate(db, {
    migrationsFolder: process.env.DATABASE_MIGRATION_FOLDER ?? './src/database/migrations',
  });
  console.log('Database migration completed');
  process.exit(0);
})();
