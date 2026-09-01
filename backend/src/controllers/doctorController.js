const pool = require('../db/pool');
const { computeRiskScore, routeByRisk } = require('../services/fraudService');

async function logAudit(claimId, actor, action) {
  await pool.query(
    'INSERT INTO audit_log (claim_id, actor, action) VALUES ($1, $2, $3)',
    [claimId, actor, action]
  );
}

// POST /claims/:claim_id/doctor-verify
// Simulates a government doctor reviewing a non-ABHA-clinic claim and
// digitally signing it (or rejecting it). Real version: this would be
// triggered from the Admin Portal by an authenticated doctor account,
// per your architecture doc's onDoctorDecision().
async function doctorVerify(req, res) {
  const { claim_id } = req.params;
  const { approved = true } = req.body;

  try {
    const claimResult = await pool.query(
      `SELECT c.claim_id, c.status, c.amount, t.worker_id, t.facility_id
       FROM claims c JOIN treatments t ON c.treatment_id = t.treatment_id
       WHERE c.claim_id = $1`,
      [claim_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    if (claim.status !== 'Sent') {
      return res.status(409).json({
        status: 'error',
        message: `Claim is already in '${claim.status}' state and cannot be re-verified`
      });
    }

    if (!approved) {
      await pool.query(
        "UPDATE claims SET status = 'Rejected', rejection_reason = $1, updated_at = NOW() WHERE claim_id = $2",
        ['Doctor did not approve the treatment record', claim_id]
      );
      await logAudit(claim_id, 'govt_doctor', 'Claim rejected on physical verification');
      return res.status(200).json({ claim_id, status: 'Rejected' });
    }

    // Approved: move to Checking, then run the same fraud pipeline as the ABHA path
    await pool.query("UPDATE claims SET status = 'Checking', updated_at = NOW() WHERE claim_id = $1", [claim_id]);
    await logAudit(claim_id, 'govt_doctor', 'Claim approved and digitally signed on physical verification');

    const riskScore = await computeRiskScore({
      workerId: claim.worker_id,
      facilityId: claim.facility_id,
      amount: claim.amount,
      claimId: claim_id
    });
    const finalStatus = routeByRisk(riskScore);

    await pool.query(
      'UPDATE claims SET status = $1, risk_score = $2, updated_at = NOW() WHERE claim_id = $3',
      [finalStatus, riskScore, claim_id]
    );
    await logAudit(claim_id, 'system', `Fraud check complete: risk_score=${riskScore}, routed to ${finalStatus}`);

    return res.status(200).json({ claim_id, status: finalStatus });
  } catch (err) {
    console.error('Doctor verify error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { doctorVerify };
