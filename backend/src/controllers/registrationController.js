const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { callAadhaarAPI, lookupABHA, createABHA, linkAawaz } = require('../services/mockExternalApis');
const { generateWorkerId } = require('../services/idGenerator');
const { hashAadhaar } = require('../services/hash');

async function registerWorker(req, res) {
  const { aadhaar_number, eshram_id, biometric_hash } = req.body;

  // Basic input presence check
  if (!aadhaar_number || !eshram_id || !biometric_hash) {
    return res.status(400).json({
      status: 'error',
      message: 'aadhaar_number, eshram_id, and biometric_hash are all required'
    });
  }

  try {
    // Step 1: Check this e-Shram ID isn't already registered
    const existing = await pool.query(
      'SELECT worker_id FROM workers WHERE eshram_id = $1',
      [eshram_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'This e-Shram ID is already registered. Please log in instead.'
      });
    }

    // Step 2: Aadhaar eKYC verification (mocked)
    const identity = await callAadhaarAPI(aadhaar_number, biometric_hash);
    if (!identity.valid) {
      return res.status(400).json({
        status: 'error',
        message: 'Identity verification failed'
      });
    }

    // Step 3: ABHA lookup-or-create (mocked)
    let abhaId = await lookupABHA(identity.uid);
    if (!abhaId) {
      abhaId = await createABHA(identity);
    }

    // Step 4: Link Aawaz insurance (mocked)
    const aawazId = await linkAawaz(identity);

    // Step 5: Generate Unified Digital ID + QR payload
    const workerId = await generateWorkerId();
    const qrPayload = `${workerId}|${abhaId}|${aawazId}`;

    // Step 6: Persist worker (Aadhaar stored only as a hash, never raw)
    const aadhaarHash = hashAadhaar(aadhaar_number);
    await pool.query(
      `INSERT INTO workers (worker_id, aadhaar_hash, eshram_id, abha_id, aawaz_id, qr_payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [workerId, aadhaarHash, eshram_id, abhaId, aawazId, qrPayload]
    );

    
    // Step 7: Issue a token immediately — a newly registered worker is
    // effectively already "logged in," no separate OTP step needed.
    const token = jwt.sign({ worker_id: workerId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      worker_id: workerId,
      abha_id: abhaId,
      aawaz_id: aawazId,
      qr_payload: qrPayload,
      token,
      status: 'success'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = { registerWorker };
