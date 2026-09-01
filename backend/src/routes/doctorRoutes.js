const express = require('express');
const router = express.Router();
const { verifyToken, verifyDoctorToken } = require('../middleware/authMiddleware');
const { getPendingVerificationClaims } = require('../controllers/claimController');
const { doctorVerify } = require('../controllers/doctorController');

router.get('/claims/pending-verification', verifyToken, verifyDoctorToken, getPendingVerificationClaims);
router.post('/claims/:claim_id/doctor-verify', verifyToken, verifyDoctorToken, doctorVerify);

module.exports = router;
