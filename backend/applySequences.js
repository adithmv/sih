// One-off migration for the sequences used by src/services/idGenerator.js.
// Safe to rerun: it creates missing sequences and advances them past existing IDs.

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const statements = [
  'CREATE SEQUENCE IF NOT EXISTS worker_id_seq START 1',
  'CREATE SEQUENCE IF NOT EXISTS claim_id_seq START 70001',
  'CREATE SEQUENCE IF NOT EXISTS dispute_id_seq START 1001',
  `SELECT setval('worker_id_seq', GREATEST(max_id, 1), max_id >= 1)
   FROM (
     SELECT COALESCE(MAX(NULLIF(regexp_replace(worker_id, '\\D', '', 'g'), '')::bigint), 0) AS max_id
     FROM workers
   ) ids`,
  `SELECT setval('claim_id_seq', GREATEST(max_id, 70001), max_id >= 70001)
   FROM (
     SELECT COALESCE(MAX(NULLIF(regexp_replace(claim_id, '\\D', '', 'g'), '')::bigint), 70000) AS max_id
     FROM claims
   ) ids`,
  `SELECT setval('dispute_id_seq', GREATEST(max_id, 1001), max_id >= 1001)
   FROM (
     SELECT COALESCE(MAX(NULLIF(regexp_replace(dispute_id, '\\D', '', 'g'), '')::bigint), 1000) AS max_id
     FROM disputes
   ) ids`
];

async function run() {
  console.log('Connecting to database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const sql of statements) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    console.log('Sequences created and synchronized with existing IDs.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to apply sequences:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
