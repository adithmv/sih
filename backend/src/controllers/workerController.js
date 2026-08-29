const pool = require('../db/pool');

async function getWorkerProfile(req, res) {
  const { worker_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT worker_id, name, qr_payload, language_pref AS language FROM workers WHERE worker_id = $1',
      [worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Worker not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get worker error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { getWorkerProfile };