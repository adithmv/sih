const pool = require('../db/pool');
const { generateDisputeId } = require('../services/idGenerator');

async function raiseDispute(req, res) {
  const { claim_id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ status: 'error', message: 'reason is required' });
  }

  try {
    // Confirm claim exists and is actually in a disputable state
    const claimResult = await pool.query(
      'SELECT claim_id, status FROM claims WHERE claim_id = $1',
      [claim_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    if (claimResult.rows[0].status !== 'Rejected') {
      return res.status(409).json({
        status: 'error',
        message: 'Only rejected claims can be disputed'
      });
    }

    // Prevent duplicate disputes on the same claim
    const existingDispute = await pool.query(
      'SELECT dispute_id FROM disputes WHERE claim_id = $1',
      [claim_id]
    );
    if (existingDispute.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'A dispute has already been raised for this claim'
      });
    }

    const disputeId = await generateDisputeId();

    await pool.query(
      `INSERT INTO disputes (dispute_id, claim_id, reason, status)
       VALUES ($1, $2, $3, 'under_review')`,
      [disputeId, claim_id, reason]
    );

    await pool.query(
      'INSERT INTO audit_log (claim_id, actor, action) VALUES ($1, $2, $3)',
      [claim_id, 'worker', `Dispute raised: ${reason}`]
    );

    return res.status(201).json({
      dispute_id: disputeId,
      status: 'under_review'
    });
  } catch (err) {
    console.error('Dispute error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { raiseDispute };