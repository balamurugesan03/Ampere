const User = require('../models/User');
const MonthlyPV = require('../models/MonthlyPV');
const CommissionTransaction = require('../models/CommissionTransaction');
const ManualPVGrant = require('../models/ManualPVGrant');
const { creditPVEarnings } = require('./commissionService');
const { recomputeRankForChain } = require('./rankService');
const { periodOf } = require('../utils/period');

/**
 * Admin grants PV to a user outside of a real order (e.g. reconciling PV owed from an
 * offline transaction). Reuses the exact same pipeline a paid order uses - self-purchase
 * and team-level income, PV bookkeeping, rank recompute - so the grant produces income
 * identical to the equivalent purchase, per the requirement that admin-granted PV should
 * also generate income "as if done through a purchase."
 */
async function grantPV(userId, pv, reason, adminId) {
  if (!pv || pv <= 0) {
    const err = new Error('pv must be greater than 0');
    err.status = 400;
    throw err;
  }
  if (!reason || !reason.trim()) {
    const err = new Error('reason is required');
    err.status = 400;
    throw err;
  }
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const grant = await ManualPVGrant.create({ user: userId, pv, reason, createdBy: adminId });
  const period = periodOf(new Date());

  await creditPVEarnings({
    userId,
    totalPV: pv,
    sourceType: 'manual_grant',
    sourceManualGrant: grant._id,
    period,
    note: `manual PV grant: ${reason}`,
  });

  return grant;
}

async function listGrantsForUser(userId) {
  return ManualPVGrant.find({ user: userId })
    .populate('createdBy', 'name')
    .populate('revokedBy', 'name')
    .sort({ createdAt: -1 });
}

/**
 * Undoes a grant: reverses every ledger row it produced (wallet + a `reversal` entry per
 * row), decrements personalPV/cumulativeTeamPV by the granted amount, and re-runs rank
 * recompute for the affected chain.
 */
async function revokePV(grantId, adminId) {
  const grant = await ManualPVGrant.findById(grantId);
  if (!grant) {
    const err = new Error('Grant not found');
    err.status = 404;
    throw err;
  }
  if (grant.status !== 'active') {
    const err = new Error('Grant is already revoked');
    err.status = 400;
    throw err;
  }

  const entries = await CommissionTransaction.find({
    sourceManualGrant: grant._id,
    type: { $in: ['self_purchase', 'team_level'] },
  });

  for (const entry of entries) {
    try {
      await CommissionTransaction.create({
        user: entry.user,
        type: 'reversal',
        amount: -entry.amount,
        sourceType: 'manual_grant',
        sourceManualGrant: grant._id,
        level: entry.level,
        period: entry.period,
        note: `Revoke of manual PV grant ${grant._id}`,
      });
    } catch (err) {
      if (err.code === 11000) continue; // already reversed - safety net, not an error
      throw err;
    }
    await User.updateOne({ _id: entry.user }, { $inc: { walletBalance: -entry.amount } });
  }

  const grantPeriod = periodOf(grant.createdAt);
  await MonthlyPV.updateOne({ user: grant.user, period: grantPeriod }, { $inc: { personalPV: -grant.pv } });

  const user = await User.findById(grant.user);
  if (user) {
    const chain = [user._id, ...(user.uplineChain || [])];
    await User.updateMany({ _id: { $in: chain } }, { $inc: { cumulativeTeamPV: -grant.pv } });
    await recomputeRankForChain(chain, { period: periodOf(new Date()) });
  }

  grant.status = 'revoked';
  grant.revokedAt = new Date();
  grant.revokedBy = adminId;
  await grant.save();
  return grant;
}

module.exports = { grantPV, listGrantsForUser, revokePV };
