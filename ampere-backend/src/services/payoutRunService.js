const User = require('../models/User');
const Order = require('../models/Order');
const MLMSettings = require('../models/MLMSettings');
const MonthlyPayoutRun = require('../models/MonthlyPayoutRun');
const CommissionTransaction = require('../models/CommissionTransaction');
const { isPgpvQualified, creditLedgerEntry } = require('./commissionService');
const { recomputeRankForChain } = require('./rankService');

function periodDateRange(period) {
  const [year, month] = period.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

async function computeTotalCompanyPV(period) {
  const { start, end } = periodDateRange(period);
  const result = await Order.aggregate([
    { $match: { paymentStatus: 'paid', paidAt: { $gte: start, $lt: end } } },
    { $unwind: '$items' },
    { $group: { _id: null, totalPV: { $sum: { $multiply: ['$items.pv', '$items.qty'] } } } },
  ]);
  return result[0]?.totalPV || 0;
}

async function runMonthlyPayout(period, adminId) {
  const existing = await MonthlyPayoutRun.findOne({ period });
  if (existing && existing.status === 'completed') {
    const err = new Error(`Period ${period} has already been run. Void it first to re-run.`);
    err.status = 400;
    throw err;
  }
  if (existing && existing.status === 'voided') {
    await MonthlyPayoutRun.deleteOne({ _id: existing._id });
  }

  const settings = await MLMSettings.getSingleton();
  const totalCompanyPV = await computeTotalCompanyPV(period);

  // This is the moment real money leaves the company pools - force a fresh, full rank
  // recompute (GPV threshold + count-based tiers, and fresh compressed PGPV) for every
  // customer first, rather than relying on the cheap/lazy recompute paths used on ordinary
  // orders, so pool eligibility below is correct even if something lagged during the month.
  const allCustomerIds = (await User.find({ role: 'customer' }).select('_id')).map((u) => u._id);
  await recomputeRankForChain(allCustomerIds, { period, force: true });

  const runDoc = await MonthlyPayoutRun.create({
    period,
    totalCompanyPV,
    pvRateUsed: settings.pvToInrRate,
    pools: [],
    runBy: adminId,
  });

  const poolResults = [];
  for (const pool of settings.bonusPools) {
    const poolAmountInr = (totalCompanyPV * settings.pvToInrRate * pool.percentOfCompanyPV) / 100;

    const candidates = await User.find({
      role: 'customer',
      currentRankSortOrder: { $gte: pool.minRankSortOrder },
    }).select('_id');

    const qualifying = [];
    for (const candidate of candidates) {
      if (await isPgpvQualified(candidate._id, period, settings, { force: true })) qualifying.push(candidate._id);
    }

    const perUserAmount = qualifying.length > 0 ? poolAmountInr / qualifying.length : 0;

    if (perUserAmount > 0) {
      for (const userId of qualifying) {
        await creditLedgerEntry({
          user: userId,
          type: 'bonus_pool',
          amount: perUserAmount,
          period,
          payoutRun: runDoc._id,
          poolKey: pool.key,
          note: `${pool.label} - ${period}`,
        });
      }
    }

    poolResults.push({
      key: pool.key,
      label: pool.label,
      percentOfCompanyPV: pool.percentOfCompanyPV,
      poolAmountInr,
      qualifyingUserCount: qualifying.length,
      perUserAmount,
    });
  }

  runDoc.pools = poolResults;
  await runDoc.save();
  return runDoc;
}

async function voidPayoutRun(runId, adminId) {
  const run = await MonthlyPayoutRun.findById(runId);
  if (!run) {
    const err = new Error('Payout run not found');
    err.status = 404;
    throw err;
  }
  if (run.status !== 'completed') {
    const err = new Error('Only a completed run can be voided');
    err.status = 400;
    throw err;
  }

  const entries = await CommissionTransaction.find({ payoutRun: run._id, type: 'bonus_pool' });
  for (const entry of entries) {
    // creditLedgerEntry is amount-positive-oriented (commission credits); a reversal is a
    // debit, so write the ledger entry + wallet decrement directly instead.
    await CommissionTransaction.create({
      user: entry.user,
      type: 'reversal',
      amount: -entry.amount,
      period: entry.period,
      note: `Void of ${run.period} payout run`,
    });
    await User.updateOne({ _id: entry.user }, { $inc: { walletBalance: -entry.amount } });
  }

  run.status = 'voided';
  run.voidedAt = new Date();
  run.voidedBy = adminId;
  await run.save();
  return run;
}

module.exports = { runMonthlyPayout, voidPayoutRun, computeTotalCompanyPV, periodDateRange };
