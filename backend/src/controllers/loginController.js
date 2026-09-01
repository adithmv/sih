const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// Prototype simplification: fixed demo OTP; production must issue expiring per-user OTPs.
const DEMO_OTP = '123456';

async function login(req, res) {
  const { eshram_id, otp } = req.body;

  if (!eshram_id || !otp) {
    return res.status(400).json({ status: 'error', message: 'eshram_id and otp are required' });
  }

  try {
    const result = await pool.query(
      'SELECT worker_id FROM workers WHERE eshram_id = $1',
      [eshram_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No worker found with this e-Shram ID' });
    }

    if (otp !== DEMO_OTP) {
      return res.status(401).json({ status: 'error', message: 'Incorrect OTP' });
    }

    const workerId = result.rows[0].worker_id;
    const token = jwt.sign({ worker_id: workerId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      worker_id: workerId,
      token,
      status: 'success'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { login };
