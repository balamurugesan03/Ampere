const User = require('../models/User');
const WalletPayout = require('../models/WalletPayout');
const CommissionTransaction = require('../models/CommissionTransaction');

async function getWalletSummary(userId) {
  const user = await User.findById(userId).select('walletBalance name email referralCode');
  return user;
}

async function recordPayout(userId, { amount, method, reference, note }, adminId) {
  if (!amount || amount <= 0) {
    const err = new Error('amount must be greater than 0');
    err.status = 400;
    throw err;
  }

  const debited = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );

  if (!debited) {
    const err = new Error('Payout amount exceeds wallet balance');
    err.status = 400;
    throw err;
  }

  const payout = await WalletPayout.create({
    user: userId,
    amount,
    method,
    reference,
    note,
    createdBy: adminId,
  });

  await CommissionTransaction.create({
    user: userId,
    type: 'payout_debit',
    amount: -amount,
    note: note || `Payout via ${method || 'manual transfer'}`,
  });

  return payout;
}

module.exports = { getWalletSummary, recordPayout };
