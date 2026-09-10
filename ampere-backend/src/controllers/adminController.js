const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

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

module.exports = { getDashboardStats, listUsers, updateUser, uploadFile };
