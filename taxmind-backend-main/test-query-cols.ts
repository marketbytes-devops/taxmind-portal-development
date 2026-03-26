import { pgTable, text } from 'drizzle-orm/pg-core';
import { db } from './src/database';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const query = sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users';
    `;
    const result = await db.execute(query);
    console.log('Columns in users table:', result.map(r => r.column_name).sort());
  } catch (error) {
    console.error('Query failed!', error);
  } finally {
    process.exit(0);
  }
}

run();
