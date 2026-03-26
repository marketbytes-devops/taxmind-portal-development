process.env.NODE_ENV = 'local';
import 'dotenv/config';
import { and, isNotNull, sql, SQL, or } from 'drizzle-orm';
import { db, models } from './src/database';
import fs from 'fs';

// Mocking hashSearchKeyword and hashTrigrams if needed, 
// but I'll use real ones from the src
import { hashSearchKeyword } from './src/utils/crypto';

async function run() {
  try {
    const keyword = 'test';
    const filters: (SQL | undefined)[] = [
      isNotNull(models.users.deletedAt),
    ];

    if (keyword) {
      const searchHashes = hashSearchKeyword(keyword.toLowerCase());
      const minMatches = Math.ceil(searchHashes.length * 0.6);
      filters.push(
        or(
          sql`(SELECT COUNT(*) FROM UNNEST(${models.users.emailTrigramHashes}) AS t1 WHERE t1 = ANY(ARRAY[${sql.join(searchHashes.map((h) => sql`${h}`), sql`, `)}]::text[])) >= ${minMatches}`,
          sql`(SELECT COUNT(*) FROM UNNEST(${models.users.phoneTrigramHashes}) AS t1 WHERE t1 = ANY(ARRAY[${sql.join(searchHashes.map((h) => sql`${h}`), sql`, `)}]::text[])) >= ${minMatches}`,
          sql`(SELECT COUNT(*) FROM UNNEST(${models.users.ppsNumberTrigramHashes}) AS t1 WHERE t1 = ANY(ARRAY[${sql.join(searchHashes.map((h) => sql`${h}`), sql`, `)}]::text[])) >= ${minMatches}`,
          sql`(SELECT COUNT(*) FROM UNNEST(${models.users.nameTrigramHashes}) AS t1 WHERE t1 = ANY(ARRAY[${sql.join(searchHashes.map((h) => sql`${h}`), sql`, `)}]::text[])) >= ${minMatches}`,
          sql`(SELECT COUNT(*) FROM UNNEST(${models.users.professionTrigramHashes}) AS t1 WHERE t1 = ANY(ARRAY[${sql.join(searchHashes.map((h) => sql`${h}`), sql`, `)}]::text[])) >= ${minMatches}`
        )
      );
    }

    console.log('Running Drizzle queries...');
    const [totalUsers, users] = await Promise.all([
      db.$count(models.users, and(...filters)),
      db.query.users.findMany({
        where: and(...filters),
        columns: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
        limit: 10,
        offset: 0,
        orderBy: (user, { asc, desc }) => [desc(user.updatedAt)],
      }),
    ]);
    console.log('Drizzle successful! Total:', totalUsers, 'Users:', users.length);
  } catch (error: any) {
    fs.writeFileSync('error.json', JSON.stringify({
      message: error.message,
      stack: error.stack,
      detail: error.detail,
      code: error.code
    }, null, 2));
    console.log('Wrote Drizzle error to error.json');
  } finally {
    process.exit(0);
  }
}

run();
