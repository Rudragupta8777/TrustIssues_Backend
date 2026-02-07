const express = require('express');
const router = express.Router();
const { 
    issueCredential, 
    revokeCredential, 
    getMyIssuedCredentials 
} = require('../controllers/credentialController');
const { verifyCertificate } = require('../controllers/verifyController');

const { protect, authorize } = require('../middleware/auth');


router.use(protect);

router.post('/issue', authorize('issuer'), issueCredential);

router.get('/my-issued', authorize('issuer'), getMyIssuedCredentials);

router.patch('/revoke/:id', authorize('issuer'), revokeCredential);

router.post('/verify', verifyCertificate);

module.exports = router;