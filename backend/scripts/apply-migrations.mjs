import { createClient } from '@libsql/client';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}

const isRemote = url.startsWith('libsql://') || url.startsWith('https://');
const client = createClient({
  url,
  ...(isRemote && process.env.TURSO_AUTH_TOKEN
    ? { authToken: process.env.TURSO_AUTH_TOKEN }
    : {}),
});

await client.executeMultiple(`
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
`);

const applied = new Set(
  (await client.execute('SELECT migration_name FROM "_prisma_migrations" WHERE rolled_back_at IS NULL'))
    .rows.map((r) => String(r.migration_name))
);

const entries = (await readdir(migrationsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const name of entries) {
  if (applied.has(name)) {
    console.log(`skip ${name}`);
    continue;
  }
  const sqlPath = path.join(migrationsDir, name, 'migration.sql');
  const sql = await readFile(sqlPath, 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex');
  console.log(`apply ${name}`);
  await client.executeMultiple(sql);
  await client.execute({
    sql: `INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, applied_steps_count)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 1)`,
    args: [randomUUID(), checksum, name],
  });
}

console.log('migrations ok');
client.close();
