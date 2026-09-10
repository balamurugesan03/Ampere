const Coupon = require('../models/Coupon');

async function validateCoupon(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ message: 'code is required' });

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon' });
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    return res.status(400).json({ message: 'Coupon has expired' });
  }

  res.json({ coupon });
}

async function listCoupons(req, res) {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
}

async function createCoupon(req, res) {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ coupon });
}

async function updateCoupon(req, res) {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ coupon });
}

async function deleteCoupon(req, res) {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  res.json({ message: 'Coupon deleted' });
}

module.exports = { validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon };
