const express = require('express');
const router = express.Router();
const { authUser, registerUser, setupFirstUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/setup', setupFirstUser); // One-time: create first admin when DB is empty
router.post('/register', protect, admin, registerUser);
router.post('/login', authUser);

module.exports = router;
