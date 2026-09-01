const pool = require('../db/pool');

// GET /claims/{worker_id} — list of all claims for a worker
async function getClaimsByWorker(req, res) {
  const { worker_id } = req.params;

  if (worker_id !== req.workerId) {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

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
      `SELECT claim_id, worker_id, status, amount, rejection_reason, updated_at
       FROM claims WHERE claim_id = $1`,
      [claim_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const { worker_id: claimWorkerId, ...claim } = result.rows[0];

    if (claimWorkerId !== req.workerId) {
      return res.status(403).json({ status: 'error', message: 'Forbidden' });
    }

    return res.status(200).json(claim);
  } catch (err) {
    console.error('Get claim status error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

// GET /claims/pending-verification — all claims awaiting doctor sign-off
async function getPendingVerificationClaims(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.claim_id, c.worker_id, c.amount, c.created_at,
              t.facility_id, t.diagnosis, t.cost
       FROM claims c
       JOIN treatments t ON t.treatment_id = c.treatment_id
       WHERE c.status = 'Checking'
       ORDER BY c.created_at ASC`
    );
    return res.status(200).json({ claims: result.rows });
  } catch (err) {
    console.error('Get pending verification claims error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { getClaimsByWorker, getClaimStatus, getPendingVerificationClaims };
