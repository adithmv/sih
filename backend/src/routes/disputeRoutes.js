const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { raiseDispute } = require('../controllers/disputeController');

router.post('/claims/:claim_id/dispute', verifyToken, raiseDispute);

module.exports = router;