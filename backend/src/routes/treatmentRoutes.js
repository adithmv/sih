const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { processTreatmentEvent } = require('../controllers/treatmentController');

router.post('/treatment-event', verifyToken, processTreatmentEvent);

module.exports = router;