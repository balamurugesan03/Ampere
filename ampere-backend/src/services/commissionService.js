const User = require('../models/User');
const MLMSettings = require('../models/MLMSettings');
const MonthlyPV = require('../models/MonthlyPV');
const CommissionTransaction = require('../models/CommissionTransaction');
const { recomputeRank, recomputeRankForChain, recomputeGpvTierOnlyForChain } = require('./rankService');
const { getCompressedPGPV } = require('./pgpvService');
const { periodOf } = require('../utils/period');

async function isPgpvQualified(userId, period, settings, { force = false } = {}) {
  const threshold = settings.pgpvThreshold || 0;
  if (threshold <= 0) return true;
  if (settings.pgpvScope === 'self_plus_team') {
    const { personalPV, teamPV } = await getCompressedPGPV(userId, period, { force });
    return personalPV + teamPV >= threshold;
  }
  // 'self' and the unimplemented 'self_plus_directs' both fall here
  const stat = await MonthlyPV.findOne({ user: userId, period });
  if (!stat) return false;
  return stat.personalPV >= threshold;
}

async function creditLedgerEntry({
  user,
  type,
  amount,
  sourceType,
  sourceOrder,
  sourceManualGrant,
  level,
  period,
  payoutRun,
  poolKey,
  note,
}) {
  if (amount <= 0) return;
  try {
    await CommissionTransaction.create({
      user,
      type,
      amount,
      sourceType,
      sourceOrder,
      sourceManualGrant,
      level,
      period,
      payoutRun,
      poolKey,
      note,
    });
  } catch (err) {
    if (err.code === 11000) return; // already credited for this source/user/type/level - safety net, not an error
    throw err;
  }
  await User.updateOne({ _id: user }, { $inc: { walletBalance: amount } });
}

async function addPersonalPV(userId, period, pv) {
  await MonthlyPV.updateOne({ user: userId, period }, { $inc: { personalPV: pv } }, { upsert: true });
}

/**
 * Core PV-crediting pipeline, shared by a real paid order (creditOrderCommissions) and an
 * admin manual PV grant (manualGrantService.grantPV): Self Purchase Bonus to the recipient,
 * Development Bonus (team_level, PGPV-gated) to up to 10 upline levels, personal/cumulative
 * PV bookkeeping, and rank recompute. `sourceType` plus exactly one of sourceOrder /
 * sourceManualGrant records where the PV came from - a manual grant produces ledger rows
 * that are otherwise identical to a real purchase's, by design.
 */
async function creditPVEarnings({ userId, totalPV, sourceType, sourceOrder, sourceManualGrant, period, note }) {
  if (totalPV <= 0) return;
  const settings = await MLMSettings.getSingleton();
  const buyer = await User.findById(userId);
  if (!buyer) return;

  // Self Purchase Bonus - not PGPV-gated
  const selfAmount = (totalPV * settings.selfPurchasePercent * settings.pvToInrRate) / 100;
  await creditLedgerEntry({
    user: buyer._id,
    type: 'self_purchase',
    amount: selfAmount,
    sourceType,
    sourceOrder,
    sourceManualGrant,
    period,
    note: note ? `Self purchase bonus - ${note}` : 'Self purchase bonus',
  });

  await addPersonalPV(buyer._id, period, totalPV);

  // Development Bonus - up to 10 levels, PGPV-gated per level
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
      sourceType,
      sourceOrder,
      sourceManualGrant,
      level,
      period,
      note: note ? `Level ${level} development bonus - ${note}` : `Level ${level} development bonus`,
    });
  }

  // Rank recompute: full for the buyer; for the upline chain, cheap GPV-only unless the
  // buyer's own rank just crossed a boundary (only then can a count-based ancestor rank
  // change), matching how cumulativeTeamPV feeds both tiers.
  const buyerRankChanged = await recomputeRank(buyer._id, { period });

  if (buyer.uplineChain && buyer.uplineChain.length) {
    await User.updateMany({ _id: { $in: buyer.uplineChain } }, { $inc: { cumulativeTeamPV: totalPV } });
    if (buyerRankChanged) {
      await recomputeRankForChain(buyer.uplineChain, { period });
    } else {
      await recomputeGpvTierOnlyForChain(buyer.uplineChain, period);
    }
  }
}

/**
 * Idempotent: caller must have already atomically flipped Order.paymentStatus to 'paid'
 * and confirmed commissionsCredited was previously false before invoking this.
 */
async function creditOrderCommissions(order) {
  const period = periodOf(order.paidAt || new Date());
  const totalPV = order.items.reduce((sum, item) => sum + (item.pv || 0) * item.qty, 0);
  await creditPVEarnings({
    userId: order.user,
    totalPV,
    sourceType: 'order',
    sourceOrder: order._id,
    period,
    note: `order #${order._id}`,
  });
}

module.exports = { creditOrderCommissions, creditPVEarnings, isPgpvQualified, creditLedgerEntry, addPersonalPV };
