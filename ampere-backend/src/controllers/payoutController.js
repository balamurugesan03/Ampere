const User = require('../models/User');
const WalletPayout = require('../models/WalletPayout');
const MonthlyPayoutRun = require('../models/MonthlyPayoutRun');
const { recordPayout } = require('../services/walletService');
const { runMonthlyPayout, voidPayoutRun } = require('../services/payoutRunService');

async function listWalletBalances(req, res) {
  const users = await User.find({ role: 'customer' })
    .select('name email referralCode walletBalance')
    .sort({ walletBalance: -1 });
  res.json({ users });
}

async function payUser(req, res) {
  try {
    const { amount, method, reference, note } = req.body;
    const payout = await recordPayout(req.params.userId, { amount, method, reference, note }, req.user._id);
    res.status(201).json({ payout });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function payoutHistory(req, res) {
  const payouts = await WalletPayout.find()
    .populate('user', 'name email referralCode')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ payouts });
}

async function runMonthlyPayoutHandler(req, res) {
  try {
    const { period } = req.body;
    if (!period) return res.status(400).json({ message: 'period (YYYY-MM) is required' });
    const run = await runMonthlyPayout(period, req.user._id);
    res.status(201).json({ run });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function monthlyPayoutRunHistory(req, res) {
  const runs = await MonthlyPayoutRun.find()
    .populate('runBy', 'name')
    .populate('voidedBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ runs });
}

async function voidMonthlyPayoutRun(req, res) {
  try {
    const run = await voidPayoutRun(req.params.id, req.user._id);
    res.json({ run });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = {
  listWalletBalances,
  payUser,
  payoutHistory,
  runMonthlyPayoutHandler,
  monthlyPayoutRunHistory,
  voidMonthlyPayoutRun,
};
