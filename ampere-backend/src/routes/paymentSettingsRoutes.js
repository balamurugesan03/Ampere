const express = require('express');
const {
  getPaymentSettings,
  updatePaymentSettings,
} = require('../controllers/paymentSettingsController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getPaymentSettings);
router.put('/', protect, requireRole('admin'), upload.single('qrImage'), updatePaymentSettings);

module.exports = router;
