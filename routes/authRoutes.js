const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// @route   POST /api/v1/auth/register
router.post('/register', register);

// @route   POST /api/v1/auth/login
router.post('/login', login);

module.exports = router;