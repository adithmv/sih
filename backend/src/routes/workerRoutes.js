const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getWorkerProfile } = require('../controllers/workerController');

router.get('/worker/:worker_id', verifyToken, getWorkerProfile);

module.exports = router;