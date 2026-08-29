const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { doctorVerify } = require('../controllers/doctorController');

router.post('/claims/:claim_id/doctor-verify', verifyToken, doctorVerify);

module.exports = router;