require('dotenv').config();
const pool = require('../db/pool');

const facilities = [
  { facility_id: 'FAC-1001', name: 'Govt. Taluk Hospital, Kochi', type: 'govt', abha_registered: true, lat: 9.9312, lng: 76.2673 },
  { facility_id: 'FAC-1002', name: 'Govt. General Hospital, Ernakulam', type: 'govt', abha_registered: true, lat: 9.9816, lng: 76.2999 },
  { facility_id: 'FAC-2001', name: 'Lakeshore Hospital (Empanelled)', type: 'empanelled', abha_registered: true, lat: 9.9698, lng: 76.3078 },
  { facility_id: 'FAC-2291', name: 'City Care Small Clinic (Non-ABHA)', type: 'small_clinic', abha_registered: false, lat: 9.9450, lng: 76.2800 },
  { facility_id: 'FAC-2300', name: 'Green Valley Clinic (ABHA-registered)', type: 'small_clinic', abha_registered: true, lat: 9.9550, lng: 76.2900 }
];

async function seed() {
  try {
    for (const f of facilities) {
      await pool.query(
        `INSERT INTO facilities (facility_id, name, type, abha_registered, lat, lng)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (facility_id) DO NOTHING`,
        [f.facility_id, f.name, f.type, f.abha_registered, f.lat, f.lng]
      );
    }
    console.log('Facilities seeded successfully.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await pool.end();
  }
}

seed();