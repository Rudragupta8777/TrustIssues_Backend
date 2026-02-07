const express = require('express');
const router = express.Router();
const { 
    issueCredential, 
    revokeCredential, 
    getMyIssuedCredentials 
} = require('../controllers/credentialController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection to all Issuer routes
router.use(protect);
router.use(authorize('issuer'));

// @route   POST /api/v1/issuer/issue
router.post('/issue', issueCredential);

// @route   GET /api/v1/issuer/my-issued
router.get('/my-issued', getMyIssuedCredentials);

// @route   PATCH /api/v1/issuer/revoke/:id
router.patch('/revoke/:id', revokeCredential);

module.exports = router;