const User = require('../models/User');
const RankDefinition = require('../models/RankDefinition');
const { getCompressedPGPV, STAR_PERFORMER_RANK_NAME } = require('./pgpvService');
const { periodOf } = require('../utils/period');

async function loadRankCatalog() {
  const ranks = await RankDefinition.find({ active: true }).sort({ sortOrder: -1 });
  const byName = new Map(ranks.map((r) => [r.name, r]));
  return { ranks, byName };
}

// gpv_threshold ranks (Seeder..Star Performer): cumulativeTeamPV is lifetime/uncompressed;
// Star Performer additionally requires the current month's compressed PGPV. `force` bypasses
// the PGPV staleness cache - pass it when correctness right now matters more than cost (the
// monthly payout run).
async function evaluateGpvThresholdRank(user, ranks, period, force) {
  for (const rank of ranks) {
    if (rank.ruleType !== 'gpv_threshold') continue;
    const c = rank.criteria || {};
    if (user.cumulativeTeamPV < (c.minCumulativeTeamPV || 0)) continue;
    if (c.minMonthlyPGPV > 0) {
      const { personalPV, teamPV } = await getCompressedPGPV(user._id, period, { force });
      if (personalPV + teamPV < c.minMonthlyPGPV) continue;
    }
    return rank;
  }
  return null;
}

// count_based ranks (Bronze Star..Double UCA): count downline members ranked at or above
// countCriteria.requiredRankName, anywhere in the downline (per user confirmation).
async function evaluateCountBasedRank(user, ranks, byName) {
  for (const rank of ranks) {
    if (rank.ruleType !== 'count_based') continue;
    const requiredRank = byName.get(rank.countCriteria?.requiredRankName);
    if (!requiredRank) continue;
    const count = await User.countDocuments({
      uplineChain: user._id,
      currentRankSortOrder: { $gte: requiredRank.sortOrder },
    });
    if (count >= (rank.countCriteria.requiredCount || 0)) return rank;
  }
  return null;
}

function applyRank(user, matched) {
  const newRankName = matched ? matched.name : null;
  const newSortOrder = matched ? matched.sortOrder : 0;
  const changed = user.currentRank !== newRankName;
  if (changed) {
    user.currentRank = newRankName;
    user.currentRankSortOrder = newSortOrder;
    user.rankAchievedAt = new Date();
  }
  return changed;
}

/**
 * Full rank recompute: GPV-threshold tier, then (only if already Star Performer-or-above,
 * since count-based ranks are meaningless below that per the chart's own ordering)
 * count-based tier. Use for the buyer on every order, and for a full-chain cascade when a
 * boundary was actually crossed, or a full pass over everyone at payout-run time.
 */
async function recomputeRank(userId, { period, force = false } = {}) {
  const user = await User.findById(userId);
  if (!user) return false;

  const { ranks, byName } = await loadRankCatalog();
  const p = period || periodOf(new Date());

  let matched = await evaluateGpvThresholdRank(user, ranks, p, force);

  const starPerformer = byName.get(STAR_PERFORMER_RANK_NAME);
  if (matched && starPerformer && matched.sortOrder >= starPerformer.sortOrder) {
    const countMatched = await evaluateCountBasedRank(user, ranks, byName);
    if (countMatched) matched = countMatched;
  }

  const changed = applyRank(user, matched);
  if (changed) await user.save();
  return changed;
}

/**
 * Cheap path for an ancestor on a normal order: only checks the GPV-threshold tier (a
 * single-document read), never the countDocuments-heavy count-based tier, and never
 * downgrades a rank the user already holds - a plain PV increment can only push someone
 * up, never down, so this is safe. Callers should fall back to a full recomputeRank when
 * they know a rank boundary was actually crossed downstream (see creditPVEarnings).
 */
async function recomputeGpvTierOnly(userId, period) {
  const user = await User.findById(userId);
  if (!user) return false;
  const { ranks } = await loadRankCatalog();
  const matched = await evaluateGpvThresholdRank(user, ranks, period || periodOf(new Date()));
  if (matched && matched.sortOrder > user.currentRankSortOrder) {
    user.currentRank = matched.name;
    user.currentRankSortOrder = matched.sortOrder;
    user.rankAchievedAt = new Date();
    await user.save();
    return true;
  }
  return false;
}

async function recomputeRankForChain(uplineChain, opts = {}) {
  for (const userId of uplineChain || []) {
    await recomputeRank(userId, opts);
  }
}

async function recomputeGpvTierOnlyForChain(uplineChain, period) {
  for (const userId of uplineChain || []) {
    await recomputeGpvTierOnly(userId, period);
  }
}

module.exports = {
  recomputeRank,
  recomputeGpvTierOnly,
  recomputeRankForChain,
  recomputeGpvTierOnlyForChain,
  loadRankCatalog,
};
