const express = require('express');
const router = express.Router();

// Middleware to protect routes (ensure user is logged in)
const { protect } = require('../middleware/auth'); 

// Import Controllers
const { verifyCertificate } = require('../controllers/verifyController');
const aiController = require('../controllers/aiController');
const employerController = require('../controllers/employerController');
const recruiterController = require('../controllers/recruiterController'); // NEW: For Database Features

// Verify a certificate by hash (Anyone can do this)
router.get('/verify/:hash', verifyCertificate);

// 1. Scan a QR code to see a student's portfolio
router.post('/scan', employerController.getStudentPortfolio);

// 2. Find best match for a SINGLE student (Non-pool)
router.post('/find-match', aiController.findBestMatch);

// --- Recruiter Database Actions (Protected) ---

// 3. Save a candidate to "My Pool"
router.post('/save-candidate', protect, recruiterController.saveCandidate);

// 4. Get all saved candidates
router.get('/my-pool', protect, recruiterController.getMyPool);

// 5. AI Search: Rank candidates & Find Best Certificate
// This hits the new function we wrote above
router.post('/search-pool', protect, recruiterController.aiSearchPool);

module.exports = router;