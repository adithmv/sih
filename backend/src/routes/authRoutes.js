const express = require('express');
const router = express.Router();
const { registerWorker } = require('../controllers/registrationController');
const { login } = require('../controllers/loginController');

router.post('/register', registerWorker);
router.post('/login', login);

module.exports = router;