const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { resolveSponsor, createMember } = require('../services/referralService');

async function getDashboardStats(req, res) {
  const [ordersCount, pendingPayments, usersCount, lowStockProducts, revenueAgg] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: 'pending' }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ stock: { $lte: 5 } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10);

  res.json({
    stats: {
      ordersCount,
      pendingPayments,
      usersCount,
      lowStockProducts,
      revenue: revenueAgg[0]?.total || 0,
    },
    recentOrders,
  });
}

async function listUsers(req, res) {
  const users = await User.find({ role: 'customer' }).select('-passwordHash').sort({ createdAt: -1 });
  res.json({ users });
}

// Admin "Add User": same as app signup, but the sponsor code is optional - leaving it empty
// creates a top-level ID (e.g. a Company ID) with no upline.
async function createUser(req, res) {
  const { name, email, password, phone, sponsorReferralCode } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  let sponsor = null;
  if (sponsorReferralCode && sponsorReferralCode.trim()) {
    sponsor = await resolveSponsor(sponsorReferralCode);
    if (!sponsor) return res.status(400).json({ message: 'Invalid sponsor referral code' });
  }

  const user = await createMember({ name, email, password, phone, sponsor });
  const { passwordHash, ...safe } = user.toObject();
  res.status(201).json({ user: safe, sponsorName: sponsor ? sponsor.name : null });
}

async function updateUser(req, res) {
  const { isBlocked } = req.body;
  const update = {};
  if (isBlocked !== undefined) update.isBlocked = isBlocked;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}

function uploadFile(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}

module.exports = { getDashboardStats, listUsers, createUser, updateUser, uploadFile };
