const User = require('../models/User');
const RankDefinition = require('../models/RankDefinition');

async function recomputeRank(userId) {
  const user = await User.findById(userId);
  if (!user) return;

  const ranks = await RankDefinition.find({ active: true }).sort({ sortOrder: -1 });

  let matched = null;
  for (const rank of ranks) {
    const c = rank.criteria;
    if (
      user.cumulativeTeamPV >= (c.minCumulativeTeamPV || 0) &&
      user.directReferralsCount >= (c.minDirectReferrals || 0) &&
      user.teamSize >= (c.minTeamSize || 0)
    ) {
      matched = rank;
      break;
    }
  }

  const newRankName = matched ? matched.name : null;
  const newSortOrder = matched ? matched.sortOrder : 0;

  if (user.currentRank !== newRankName) {
    user.currentRank = newRankName;
    user.currentRankSortOrder = newSortOrder;
    user.rankAchievedAt = new Date();
    await user.save();
  }
}

async function recomputeRankForChain(uplineChain) {
  for (const userId of uplineChain || []) {
    await recomputeRank(userId);
  }
}

module.exports = { recomputeRank, recomputeRankForChain };
