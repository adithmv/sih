const pool = require('../db/pool');

async function generateWorkerId() {
  const result = await pool.query('SELECT COUNT(*) FROM workers');
  const nextNumber = parseInt(result.rows[0].count, 10) + 1;
  return `WRK-${String(nextNumber).padStart(5, '0')}`;
}

async function generateClaimId() {
  const result = await pool.query('SELECT COUNT(*) FROM claims');
  const nextNumber = parseInt(result.rows[0].count, 10) + 1;
  return `CLM-${String(70000 + nextNumber)}`;
}

async function generateDisputeId() {
  const result = await pool.query('SELECT COUNT(*) FROM disputes');
  const nextNumber = parseInt(result.rows[0].count, 10) + 1;
  return `DIS-${String(1000 + nextNumber)}`;
}

module.exports = { generateWorkerId, generateClaimId, generateDisputeId };