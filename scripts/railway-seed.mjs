import pg from 'pg';
import { spawnSync } from 'node:child_process';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await client.query(
    'SELECT EXISTS (SELECT 1 FROM "Product") AS populated',
  );
  if (result.rows[0].populated) {
    console.log('Catalogue already populated; skipping import.');
  } else {
    const seed = spawnSync(
      process.execPath,
      ['apps/api/dist/catalogue-seed.js'],
      {
        stdio: 'inherit',
      },
    );
    if (seed.error) throw seed.error;
    if (seed.status !== 0) process.exitCode = seed.status ?? 1;
  }
} finally {
  await client.end();
}
