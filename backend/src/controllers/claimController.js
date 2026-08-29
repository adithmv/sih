const pool = require('../db/pool');

// GET /claims/{worker_id} — list of all claims for a worker
async function getClaimsByWorker(req, res) {
  const { worker_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT claim_id, created_at AS date, status, amount, rejection_reason
       FROM claims WHERE worker_id = $1 ORDER BY created_at DESC`,
      [worker_id]
    );

    return res.status(200).json({ claims: result.rows });
  } catch (err) {
    console.error('Get claims error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

// GET /claims/{claim_id}/status — single claim's live status
async function getClaimStatus(req, res) {
  const { claim_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT claim_id, status, amount, rejection_reason, updated_at
       FROM claims WHERE claim_id = $1`,
      [claim_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get claim status error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { getClaimsByWorker, getClaimStatus };