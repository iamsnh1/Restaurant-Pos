const express = require('express');
const router = express.Router();
const { authUser, registerUser, setupFirstUser, setupAdminEmergency } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/first-setup-admin', setupAdminEmergency); // Emergency browser route
router.post('/setup', setupFirstUser);
router.post('/register', protect, admin, registerUser);
router.post('/login', authUser);

module.exports = router;
