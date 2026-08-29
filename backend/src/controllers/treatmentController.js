const pool = require('../db/pool');
const { getFacilityById } = require('../services/facilityService');
const { computeRiskScore, routeByRisk } = require('../services/fraudService');
const { generateClaimId } = require('../services/idGenerator');

async function logAudit(claimId, actor, action) {
  await pool.query(
    'INSERT INTO audit_log (claim_id, actor, action) VALUES ($1, $2, $3)',
    [claimId, actor, action]
  );
}

async function processTreatmentEvent(req, res) {
  const { worker_id, facility_id, diagnosis, treatment_cost } = req.body;

  if (!worker_id || !facility_id || !diagnosis || treatment_cost === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'worker_id, facility_id, diagnosis, and treatment_cost are all required'
    });
  }

  try {
    // Confirm worker exists
    const workerCheck = await pool.query('SELECT worker_id FROM workers WHERE worker_id = $1', [worker_id]);
    if (workerCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Worker not found' });
    }

    // Look up facility — this drives the entire routing decision
    const facility = await getFacilityById(facility_id);
    if (!facility) {
      return res.status(404).json({ status: 'error', message: 'Facility not found' });
    }

    // Log the treatment (raw record, regardless of ABHA sync status)
    const treatmentResult = await pool.query(
      `INSERT INTO treatments (treatment_id, worker_id, facility_id, diagnosis, procedure_desc, cost, synced_from_abha)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING treatment_id`,
      [
        `TRT-${Date.now()}`,
        worker_id,
        facility_id,
        diagnosis,
        diagnosis, // prototype simplification: no separate "procedure" field from frontend yet
        treatment_cost,
        facility.abha_registered
      ]
    );
    const treatmentId = treatmentResult.rows[0].treatment_id;

    const claimId = await generateClaimId();

    if (facility.abha_registered) {
      // ABHA-registered path: auto-sync, straight to fraud scoring
      await pool.query(
        `INSERT INTO claims (claim_id, treatment_id, worker_id, status, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [claimId, treatmentId, worker_id, 'Checking', treatment_cost]
      );
      await logAudit(claimId, 'system', 'Claim auto-created: ABHA-registered facility, treatment auto-synced');

      const riskScore = await computeRiskScore({ workerId: worker_id, facilityId: facility_id, amount: treatment_cost, claimId });
      const finalStatus = routeByRisk(riskScore);

      await pool.query(
        'UPDATE claims SET status = $1, risk_score = $2, updated_at = NOW() WHERE claim_id = $3',
        [finalStatus, riskScore, claimId]
      );
      await logAudit(claimId, 'system', `Fraud check complete: risk_score=${riskScore}, routed to ${finalStatus}`);

      return res.status(201).json({
        claim_id: claimId,
        status: finalStatus,
        facility_type: 'abha_registered',
        redirect_required: false
      });
    } else {
      // Non-ABHA clinic: create claim as Sent, pending govt-hospital verification
      await pool.query(
        `INSERT INTO claims (claim_id, treatment_id, worker_id, status, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [claimId, treatmentId, worker_id, 'Sent', treatment_cost]
      );
      await logAudit(claimId, 'system', 'Claim created: non-ABHA clinic, routed for govt. hospital verification');

      const nearestHospital = await pool.query(
        `SELECT name, lat, lng FROM facilities WHERE type = 'govt' ORDER BY facility_id LIMIT 1`
      );

      return res.status(201).json({
        claim_id: claimId,
        status: 'Sent',
        facility_type: 'non_abha_clinic',
        redirect_required: true,
        nearest_govt_hospital: nearestHospital.rows[0] || null
      });
    }
  } catch (err) {
    console.error('Treatment event error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { processTreatmentEvent };