const User = require('../models/User');
const MLMSettings = require('../models/MLMSettings');
const MonthlyPV = require('../models/MonthlyPV');
const CommissionTransaction = require('../models/CommissionTransaction');
const { recomputeRankForChain } = require('./rankService');

function periodOf(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function isPgpvQualified(userId, period, settings) {
  const stat = await MonthlyPV.findOne({ user: userId, period });
  const threshold = settings.pgpvThreshold || 0;
  if (threshold <= 0) return true;
  if (!stat) return false;
  if (settings.pgpvScope === 'self_plus_team') return stat.personalPV + stat.teamPV >= threshold;
  return stat.personalPV >= threshold;
}

async function creditLedgerEntry({ user, type, amount, sourceOrder, level, period, payoutRun, poolKey, note }) {
  if (amount <= 0) return;
  try {
    await CommissionTransaction.create({ user, type, amount, sourceOrder, level, period, payoutRun, poolKey, note });
  } catch (err) {
    if (err.code === 11000) return; // already credited for this order/user/type/level(/payoutRun) - safety net, not an error
    throw err;
  }
  await User.updateOne({ _id: user }, { $inc: { walletBalance: amount } });
}

async function addPersonalPV(userId, period, pv) {
  await MonthlyPV.updateOne(
    { user: userId, period },
    { $inc: { personalPV: pv } },
    { upsert: true }
  );
}

/**
 * Idempotent: caller must have already atomically flipped Order.paymentStatus to 'paid'
 * and confirmed commissionsCredited was previously false before invoking this.
 */
async function creditOrderCommissions(order) {
  const settings = await MLMSettings.getSingleton();
  const period = periodOf(order.paidAt || new Date());
  const totalPV = order.items.reduce((sum, item) => sum + (item.pv || 0) * item.qty, 0);

  if (totalPV <= 0) return;

  const buyer = await User.findById(order.user);
  if (!buyer) return;

  // Self Purchase Income - not PGPV-gated
  const selfAmount = (totalPV * settings.selfPurchasePercent * settings.pvToInrRate) / 100;
  await creditLedgerEntry({
    user: buyer._id,
    type: 'self_purchase',
    amount: selfAmount,
    sourceOrder: order._id,
    note: `Self purchase on order #${order._id}`,
  });

  await addPersonalPV(buyer._id, period, totalPV);

  // Team Development Income - up to 10 levels, PGPV-gated per level, no compression
  const chain = (buyer.uplineChain || []).slice(0, 10);
  for (let i = 0; i < chain.length; i++) {
    const level = i + 1;
    const percent = settings.teamLevelPercents[i] || 0;
    if (percent <= 0) continue;

    const sponsorId = chain[i];
    const qualified = await isPgpvQualified(sponsorId, period, settings);
    if (!qualified) continue;

    const amount = (totalPV * percent * settings.pvToInrRate) / 100;
    await creditLedgerEntry({
      user: sponsorId,
      type: 'team_level',
      amount,
      sourceOrder: order._id,
      level,
      note: `Level ${level} team development income from order #${order._id}`,
    });
  }

  // cumulative team PV up the whole chain (unbounded), feeds rank thresholds
  if (buyer.uplineChain && buyer.uplineChain.length) {
    await User.updateMany({ _id: { $in: buyer.uplineChain } }, { $inc: { cumulativeTeamPV: totalPV } });
    await recomputeRankForChain(buyer.uplineChain);
  }
}

module.exports = { creditOrderCommissions, periodOf, isPgpvQualified, creditLedgerEntry };
