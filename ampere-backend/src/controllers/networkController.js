const User = require('../models/User');

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

module.exports = { myDownline, userDownline };
