const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.workerId = decoded.worker_id; // attach for downstream handlers
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

// Demo-only placeholder for real doctor-account authentication in production.
function verifyDoctorToken(req, res, next) {
  if (!process.env.DOCTOR_TOKEN || req.get('X-Doctor-Key') !== process.env.DOCTOR_TOKEN) {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  next();
}

module.exports = { verifyToken, verifyDoctorToken };
