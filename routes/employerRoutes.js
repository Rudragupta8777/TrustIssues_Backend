const express = require('express');
const router = express.Router();
const { verifyCertificate } = require('../controllers/verifyController');

// Verification is usually public so employers don't need to log in to scan a QR
// @route   POST /api/v1/employer/verify
router.post('/verify', verifyCertificate);

module.exports = router;