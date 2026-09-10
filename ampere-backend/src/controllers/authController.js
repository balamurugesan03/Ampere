const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const {
  generateReferralCode,
  resolveSponsor,
  buildUplineChain,
  incrementUplineCounters,
} = require('../services/referralService');

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    rewardsPoints: user.rewardsPoints,
    notificationsEnabled: user.notificationsEnabled,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance,
    currentRank: user.currentRank,
    currentRankSortOrder: user.currentRankSortOrder,
    cumulativeTeamPV: user.cumulativeTeamPV,
    directReferralsCount: user.directReferralsCount,
    teamSize: user.teamSize,
  };
}

async function signup(req, res) {
  const { name, email, password, phone, referralCode } = req.body;
  if (!name || !email || !password || !referralCode) {
    return res.status(400).json({ message: 'name, email, password and referralCode are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const sponsor = await resolveSponsor(referralCode);
  if (!sponsor) return res.status(400).json({ message: 'Invalid referral code' });

  const passwordHash = await bcrypt.hash(password, 10);
  const ownReferralCode = await generateReferralCode();
  const uplineChain = buildUplineChain(sponsor);

  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    role: 'customer',
    referralCode: ownReferralCode,
    sponsor: sponsor._id,
    uplineChain,
  });

  await incrementUplineCounters(uplineChain);

  res.status(201).json({ token: generateToken(user._id), user: toPublicUser(user) });
}

async function validateReferralCode(req, res) {
  const sponsor = await resolveSponsor(req.params.code);
  if (!sponsor) return res.json({ valid: false, message: 'Invalid referral code' });
  res.json({ valid: true, sponsorName: sponsor.name });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid email or password' });
  if (user.isBlocked) return res.status(403).json({ message: 'Account is blocked' });

  res.json({ token: generateToken(user._id), user: toPublicUser(user) });
}

async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

async function updateMe(req, res) {
  const { name, phone, notificationsEnabled } = req.body;
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (notificationsEnabled !== undefined) req.user.notificationsEnabled = notificationsEnabled;
  await req.user.save();
  res.json({ user: toPublicUser(req.user) });
}

module.exports = { signup, login, me, updateMe, validateReferralCode, toPublicUser };
