const User = require('../models/User');
const CommissionTransaction = require('../models/CommissionTransaction');
const { getWalletSummary } = require('../services/walletService');

async function myWallet(req, res) {
  const user = await getWalletSummary(req.user._id);
  res.json({ walletBalance: user.walletBalance });
}

async function myTransactions(req, res) {
  const transactions = await CommissionTransaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ transactions });
}

async function userWallet(req, res) {
  const user = await User.findById(req.params.userId).select('name email referralCode walletBalance');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
}

async function userTransactions(req, res) {
  const transactions = await CommissionTransaction.find({ user: req.params.userId }).sort({ createdAt: -1 });
  res.json({ transactions });
}

module.exports = { myWallet, myTransactions, userWallet, userTransactions };
