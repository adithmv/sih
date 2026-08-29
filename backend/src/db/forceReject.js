require('dotenv').config();
const pool = require('../db/pool');

async function forceReject(claimId) {
  await pool.query(
    "UPDATE claims SET status = 'Rejected', rejection_reason = $1 WHERE claim_id = $2",
    ['Duplicate treatment claim for same date', claimId]
  );
  console.log(`${claimId} marked as Rejected.`);
  await pool.end();
}

forceReject(process.argv[2]);