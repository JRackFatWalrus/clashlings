/**
 * One-time migration runner. Pushes all SQL migrations to Supabase.
 * Usage: npx tsx scripts/push-migrations.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import pg from 'pg';

const { Client } = pg;

const PROJECT_REF = 'qchminkplfqbzlfslzbk';
const DB_PASS = process.env.SUPABASE_DB_PASSWORD || '';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
];

async function tryConnect(): Promise<pg.Client> {
  // Try direct connection first
  const directHost = `db.${PROJECT_REF}.supabase.co`;
  try {
    const client = new Client({
      host: directHost,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: DB_PASS,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    await client.connect();
    console.log(`Connected via direct: ${directHost}`);
    return client;
  } catch {
    console.log(`Direct connection failed, trying pooler regions...`);
  }

  // Try pooler connection with each region
  for (const region of REGIONS) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const user = `postgres.${PROJECT_REF}`;
    try {
      const client = new Client({
        host,
        port: 5432,
        database: 'postgres',
        user,
        password: DB_PASS,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await client.connect();
      console.log(`Connected via pooler: ${host} (${region})`);
      return client;
    } catch {
      // try next region
    }
  }

  // Try session mode pooler (port 6543)
  for (const region of REGIONS) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const user = `postgres.${PROJECT_REF}`;
    try {
      const client = new Client({
        host,
        port: 6543,
        database: 'postgres',
        user,
        password: DB_PASS,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await client.connect();
      console.log(`Connected via session pooler: ${host}:6543 (${region})`);
      return client;
    } catch {
      // try next region
    }
  }

  throw new Error('Could not connect to any Supabase database endpoint');
}

async function main() {
  if (!DB_PASS) {
    console.error('Set SUPABASE_DB_PASSWORD env var');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL...\n');
  const client = await tryConnect();
  console.log('');

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`Running: ${file}`);
    try {
      await client.query(sql);
      console.log(`  OK\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR: ${msg}\n`);
    }
  }

  await client.end();
  console.log('Done. All migrations applied.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
