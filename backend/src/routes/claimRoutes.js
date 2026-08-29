const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getClaimsByWorker, getClaimStatus } = require('../controllers/claimController');

router.get('/claims/:claim_id/status', verifyToken, getClaimStatus); // more specific route first
router.get('/claims/:worker_id', verifyToken, getClaimsByWorker);

module.exports = router;