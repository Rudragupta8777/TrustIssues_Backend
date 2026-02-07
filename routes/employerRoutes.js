const express = require('express');
const router = express.Router();
const { verifyCertificate } = require('../controllers/verifyController');

// Change from POST to GET to match the hash-based verification
router.get('/verify/:hash', verifyCertificate);

module.exports = router;