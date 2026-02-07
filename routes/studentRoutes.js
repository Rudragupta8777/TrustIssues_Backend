const express = require('express');
const router = express.Router();
const { getStudentDashboard, toggleVisibility } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All routes here require the user to be a 'student'
router.use(protect);
router.use(authorize('student'));

router.get('/dashboard', getStudentDashboard);
router.patch('/toggle-share/:id', toggleVisibility);

module.exports = router;