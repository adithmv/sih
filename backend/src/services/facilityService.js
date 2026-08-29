const pool = require('../db/pool');

async function getFacilityById(facilityId) {
  const result = await pool.query(
    'SELECT * FROM facilities WHERE facility_id = $1',
    [facilityId]
  );
  return result.rows[0] || null;
}

module.exports = { getFacilityById };