const express = require('express');
const router = express.Router();
const { authUser, registerUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', protect, admin, registerUser);
router.post('/login', authUser);

module.exports = router;
