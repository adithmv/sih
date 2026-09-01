const pool = require('../db/pool');

async function generateWorkerId() {
  const result = await pool.query("SELECT nextval('worker_id_seq') AS id");
  const nextNumber = parseInt(result.rows[0].id, 10);
  return `WRK-${String(nextNumber).padStart(5, '0')}`;
}

async function generateClaimId() {
  const result = await pool.query("SELECT nextval('claim_id_seq') AS id");
  return `CLM-${String(result.rows[0].id)}`;
}

async function generateDisputeId() {
  const result = await pool.query("SELECT nextval('dispute_id_seq') AS id");
  return `DIS-${String(result.rows[0].id)}`;
}

module.exports = { generateWorkerId, generateClaimId, generateDisputeId };
