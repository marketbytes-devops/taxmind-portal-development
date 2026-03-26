import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function run() {
  try {
    const sql = `select count(*) as count from "users" where "users"."deleted_at" is not null;`;
    const res = await pool.query(sql);
    console.log('Count successful! Result:', res.rows[0]);
  } catch (error: any) {
    console.error('Count failed!', error.message);
  } finally {
    process.exit(0);
  }
}

run();
