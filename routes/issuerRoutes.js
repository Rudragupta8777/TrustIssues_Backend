const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Import middleware
const { issueCredential, getMyIssuedCredentials, revokeCredential } = require('../controllers/credentialController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('issuer'));

// Add upload.single('certificateFile') to the POST route
router.post('/issue', upload.single('certificateFile'), issueCredential);

router.get('/my-issued', getMyIssuedCredentials);
router.patch('/revoke/:id', revokeCredential);

module.exports = router;