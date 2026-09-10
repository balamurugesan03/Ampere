const express = require('express');
const {
  validateCoupon,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/validate', validateCoupon);
router.get('/', protect, requireRole('admin'), listCoupons);
router.post('/', protect, requireRole('admin'), createCoupon);
router.put('/:id', protect, requireRole('admin'), updateCoupon);
router.delete('/:id', protect, requireRole('admin'), deleteCoupon);

module.exports = router;
