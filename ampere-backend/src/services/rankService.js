const User = require('../models/User');
const MonthlyPV = require('../models/MonthlyPV');
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

/**
 * Number of distinct direct legs of `userId` that contain at least one member (the leg
 * head itself or anyone below it) ranked at sortOrder >= minSortOrder. Two qualifiers in
 * the same leg count once.
 */
async function countQualifyingLegs(userId, minSortOrder) {
  const members = await User.find({ uplineChain: userId, currentRankSortOrder: { $gte: minSortOrder } })
    .select('_id uplineChain')
    .lean();
  const uid = String(userId);
  const legs = new Set();
  for (const m of members) {
    const idx = m.uplineChain.findIndex((a) => String(a) === uid);
    legs.add(String(idx === 0 ? m._id : m.uplineChain[idx - 1]));
  }
  return legs.size;
}

// count_based ranks (Bronze Star..Double UCA): count direct legs that contain a member
// ranked at or above countCriteria.requiredRankName (one per leg, at any depth in that leg).
async function evaluateCountBasedRank(user, ranks, byName) {
  const legCountByRank = new Map();
  for (const rank of ranks) {
    if (rank.ruleType !== 'count_based') continue;
    const requiredRank = byName.get(rank.countCriteria?.requiredRankName);
    if (!requiredRank) continue;
    if (!legCountByRank.has(requiredRank.name)) {
      legCountByRank.set(requiredRank.name, await countQualifyingLegs(user._id, requiredRank.sortOrder));
    }
    if (legCountByRank.get(requiredRank.name) >= (rank.countCriteria.requiredCount || 0)) return rank;
  }
  return null;
}

// A rank change moves compression walls, so ancestors' memoized compressed PGPV is stale.
async function invalidateUplinePGPV(user, period) {
  if (!user.uplineChain || !user.uplineChain.length) return;
  await MonthlyPV.updateMany({ user: { $in: user.uplineChain }, period }, { $unset: { teamPVComputedAt: 1 } });
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
  if (changed) {
    await user.save();
    await invalidateUplinePGPV(user, p);
  }
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
  const p = period || periodOf(new Date());
  const matched = await evaluateGpvThresholdRank(user, ranks, p);
  if (matched && matched.sortOrder > user.currentRankSortOrder) {
    user.currentRank = matched.name;
    user.currentRankSortOrder = matched.sortOrder;
    user.rankAchievedAt = new Date();
    await user.save();
    await invalidateUplinePGPV(user, p);
    return true;
  }
  return false;
}

async function recomputeRankForChain(uplineChain, opts = {}) {
  for (const userId of uplineChain || []) {
    await recomputeRank(userId, opts);
  }
}

/**
 * Walks an upline chain nearest-first after new PV. Each ancestor gets the cheap GPV-only
 * check until some rank at or below it changes (`belowChanged` for the buyer, or an
 * ancestor crossing a boundary during this walk) - from then on every higher ancestor gets
 * a full recompute, since its qualifying-leg count for a count-based rank may have changed.
 */
async function recomputeUplineAfterPV(uplineChain, period, belowChanged = false) {
  let cascade = belowChanged;
  for (const userId of uplineChain || []) {
    const changed = cascade ? await recomputeRank(userId, { period }) : await recomputeGpvTierOnly(userId, period);
    if (changed) cascade = true;
  }
}

module.exports = {
  recomputeRank,
  recomputeGpvTierOnly,
  recomputeRankForChain,
  recomputeUplineAfterPV,
  countQualifyingLegs,
  loadRankCatalog,
};
