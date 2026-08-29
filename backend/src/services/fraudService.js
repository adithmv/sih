const pool = require('../db/pool');

/**
 * Rule 1: Duplicate claim check (+40)
 * Same worker + same facility + same day = likely duplicate submission.
 */
async function isDuplicate(workerId, facilityId, excludeClaimId) {
  const result = await pool.query(
    `SELECT c.claim_id FROM claims c
     JOIN treatments t ON c.treatment_id = t.treatment_id
     WHERE t.worker_id = $1 AND t.facility_id = $2
       AND t.created_at::date = CURRENT_DATE
       AND c.status != 'Rejected'
       AND c.claim_id != $3`,
    [workerId, facilityId, excludeClaimId]
  );
  return result.rows.length > 0;
}

/**
 * Rule 2: Cost outlier check (+25)
 * Flags if this claim costs more than 2.5x this facility's historical average.
 * Simplification: with little seed data, a facility's first few claims won't
 * have a meaningful average yet — we skip this check until a facility has
 * at least 3 prior treatments logged.
 */
async function isCostOutlier(facilityId, amount) {
  const result = await pool.query(
    `SELECT AVG(cost) AS avg_cost, COUNT(*) AS n FROM treatments WHERE facility_id = $1`,
    [facilityId]
  );
  const { avg_cost, n } = result.rows[0];
  if (parseInt(n, 10) < 3 || avg_cost === null) return false;
  return parseFloat(amount) > parseFloat(avg_cost) * 2.5;
}

/**
 * Rule 3: Claim frequency spike (+20)
 * Flags if this facility has an unusually high number of claims in the last 7 days.
 * Simplification: uses a fixed threshold (5) as the "baseline" rather than a
 * learned per-facility baseline, since we don't have months of historical data
 * in a prototype. Documented as a place production would use real history.
 */
async function isFrequencySpike(facilityId) {
  const result = await pool.query(
    `SELECT COUNT(*) FROM claims c
     JOIN treatments t ON c.treatment_id = t.treatment_id
     WHERE t.facility_id = $1 AND c.created_at > NOW() - INTERVAL '7 days'`,
    [facilityId]
  );
  return parseInt(result.rows[0].count, 10) > 5;
}

/**
 * Rule 4: Diagnosis-treatment mismatch (+25)
 * Real version needs a medical ontology/NLP model to check if the procedure
 * matches the diagnosis. Out of scope for a hackathon prototype — always
 * returns false (no mismatch detected). Documented simplification.
 */
function diagnosisMatchesTreatment() {
  return true; // always "matches" in the prototype
}

async function computeRiskScore(claim) {
  let score = 0;

  if (await isDuplicate(claim.workerId, claim.facilityId, claim.claimId)) score += 40;
  if (await isCostOutlier(claim.facilityId, claim.amount)) score += 25;
  if (await isFrequencySpike(claim.facilityId)) score += 20;
  if (!diagnosisMatchesTreatment()) score += 25;

  return Math.min(score, 100);
}

function routeByRisk(riskScore) {
  if (riskScore < 30) return 'Approved';
  if (riskScore < 70) return 'Checking'; // medium — held for human review
  return 'Checking'; // high — held + flagged for audit (same visible status, different internal handling)
}

module.exports = { computeRiskScore, routeByRisk };