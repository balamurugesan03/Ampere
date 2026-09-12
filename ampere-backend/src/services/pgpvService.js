const User = require('../models/User');
const MonthlyPV = require('../models/MonthlyPV');
const RankDefinition = require('../models/RankDefinition');

const STAR_PERFORMER_RANK_NAME = 'Star Performer';
const TEAM_PV_STALE_MS = 60 * 60 * 1000; // 1 hour - Phase 1 tradeoff, see plan doc

let starPerformerSortOrderCache = null;
let starPerformerSortOrderCacheAt = 0;

// Resolved dynamically (not hardcoded) so admins can rename/reorder ranks without a code
// change; cached briefly since it's read on every PGPV computation.
async function getStarPerformerSortOrder() {
  if (starPerformerSortOrderCache !== null && Date.now() - starPerformerSortOrderCacheAt < TEAM_PV_STALE_MS) {
    return starPerformerSortOrderCache;
  }
  const rank = await RankDefinition.findOne({ name: STAR_PERFORMER_RANK_NAME });
  starPerformerSortOrderCache = rank ? rank.sortOrder : Infinity; // unconfigured -> nobody compresses
  starPerformerSortOrderCacheAt = Date.now();
  return starPerformerSortOrderCache;
}

/**
 * Batched BFS walk of a user's downline for one period. Compresses (stops descending) at
 * any member who is themselves Star Performer-or-above: their own personalPV still counts
 * toward the ancestor's group PV, but their subtree does not - it's already counted toward
 * their own PGPV requirement. This is the literal spec: "PGPV = business each rank holder
 * must bring, excluding the business of rank-holders below them who've already qualified."
 */
async function computeCompressedTeamPV(rootUserId, period, starPerformerSortOrder) {
  let total = 0;
  let frontier = [rootUserId];
  const visited = new Set([String(rootUserId)]);

  while (frontier.length) {
    const children = await User.find({ sponsor: { $in: frontier } })
      .select('_id currentRankSortOrder')
      .lean();
    if (!children.length) break;

    const childIds = children.map((c) => c._id);
    const stats = await MonthlyPV.find({ user: { $in: childIds }, period }).select('user personalPV').lean();
    const pvByUser = new Map(stats.map((s) => [String(s.user), s.personalPV || 0]));

    const nextFrontier = [];
    for (const child of children) {
      const idStr = String(child._id);
      if (visited.has(idStr)) continue; // defensive guard against a cyclic sponsor graph
      visited.add(idStr);
      total += pvByUser.get(idStr) || 0;
      if ((child.currentRankSortOrder || 0) < starPerformerSortOrder) {
        nextFrontier.push(child._id); // not a compression wall yet - keep descending
      }
    }
    frontier = nextFrontier;
  }

  return total;
}

/**
 * Compressed Personal Group PV for (userId, period): { personalPV, teamPV }. Memoized on
 * MonthlyPV.teamPV/teamPVComputedAt; recomputed if stale (>1h) or `force` is passed. Callers
 * that are about to move real money (the monthly payout run) should always pass force:true.
 */
async function getCompressedPGPV(userId, period, { force = false } = {}) {
  const personalStat = await MonthlyPV.findOne({ user: userId, period });
  const personalPV = personalStat?.personalPV || 0;

  const fresh =
    !force &&
    personalStat?.teamPVComputedAt &&
    Date.now() - personalStat.teamPVComputedAt.getTime() < TEAM_PV_STALE_MS;

  if (fresh) return { personalPV, teamPV: personalStat.teamPV || 0 };

  const starPerformerSortOrder = await getStarPerformerSortOrder();
  const teamPV = await computeCompressedTeamPV(userId, period, starPerformerSortOrder);

  await MonthlyPV.updateOne(
    { user: userId, period },
    { $set: { teamPV, teamPVComputedAt: new Date() } },
    { upsert: true }
  );

  return { personalPV, teamPV };
}

module.exports = { getCompressedPGPV, getStarPerformerSortOrder, STAR_PERFORMER_RANK_NAME };
