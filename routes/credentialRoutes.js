const express = require('express');
const router = express.Router();
const { 
    issueCredential, 
    revokeCredential, 
    getMyIssuedCredentials 
} = require('../controllers/credentialController');
const { verifyCertificate } = require('../controllers/verifyController');

// Import your custom middleware
const { protect, authorize } = require('../middleware/auth');

// --- SECURE ROUTES ---

// All routes below require the user to be logged in (Protect)
router.use(protect);

// 1. Issue: Only an 'issuer' (Institute) can call this
router.post('/issue', authorize('issuer'), issueCredential);

// 2. View: See all certificates your institute has issued
router.get('/my-issued', authorize('issuer'), getMyIssuedCredentials);

// 3. Revoke: Only the issuer can revoke their own certificates
router.patch('/revoke/:id', authorize('issuer'), revokeCredential);

router.post('/verify', verifyCertificate);

module.exports = router;