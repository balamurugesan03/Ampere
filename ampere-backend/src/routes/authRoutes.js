const express = require('express');
const { signup, login, me, updateMe, validateReferralCode } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, me);
router.put('/me', protect, updateMe);
router.get('/referral/:code/validate', validateReferralCode);

module.exports = router;
