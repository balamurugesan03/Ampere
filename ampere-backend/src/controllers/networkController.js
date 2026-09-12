const User = require('../models/User');
const RankDefinition = require('../models/RankDefinition');
const { getCompressedPGPV } = require('../services/pgpvService');
const { periodOf } = require('../utils/period');

// Feeds the "next rank" progress display: compressed PGPV for the current period, plus,
// for every rank name any count_based RankDefinition references (Star Performer, Diamond,
// Universal Crown Ambassador in the default chart), how many downline members the caller
// currently has at that rank or higher, anywhere in their downline.
async function myRankProgress(req, res) {
  const period = periodOf(new Date());
  const { personalPV, teamPV } = await getCompressedPGPV(req.user._id, period);

  const countRanks = await RankDefinition.find({ ruleType: 'count_based', active: true }).select('countCriteria');
  const requiredNames = [...new Set(countRanks.map((r) => r.countCriteria?.requiredRankName).filter(Boolean))];
  const requiredRankDocs = await RankDefinition.find({ name: { $in: requiredNames } }).select('name sortOrder');
  const sortOrderByName = Object.fromEntries(requiredRankDocs.map((r) => [r.name, r.sortOrder]));

  const countsByRankName = {};
  for (const name of requiredNames) {
    const sortOrder = sortOrderByName[name];
    if (sortOrder === undefined) continue;
    countsByRankName[name] = await User.countDocuments({
      uplineChain: req.user._id,
      currentRankSortOrder: { $gte: sortOrder },
    });
  }

  res.json({ period, personalPV, teamPV, countsByRankName });
}

async function myDownline(req, res) {
  const directs = await User.find({ sponsor: req.user._id })
    .select('name email phone referralCode createdAt teamSize')
    .sort({ createdAt: -1 });
  res.json({ directReferrals: directs, directReferralsCount: directs.length });
}

async function userDownline(req, res) {
  const rootId = req.params.userId;
  const descendants = await User.find({ uplineChain: rootId })
    .select('name email phone referralCode createdAt uplineChain teamSize walletBalance')
    .sort({ createdAt: 1 });

  const downline = descendants.map((u) => {
    const level = u.uplineChain.findIndex((id) => id.toString() === rootId) + 1;
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      referralCode: u.referralCode,
      createdAt: u.createdAt,
      teamSize: u.teamSize,
      walletBalance: u.walletBalance,
      level,
    };
  });

  res.json({ downline, totalCount: downline.length });
}

module.exports = { myDownline, userDownline, myRankProgress };
