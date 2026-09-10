const User = require('../models/User');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function randomCode(length = 8) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function generateReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await User.findOne({ referralCode: code }).select('_id');
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique referral code, please retry');
}

async function resolveSponsor(referralCode) {
  if (!referralCode) return null;
  return User.findOne({ referralCode: referralCode.toUpperCase().trim() });
}

function buildUplineChain(sponsor) {
  if (!sponsor) return [];
  return [sponsor._id, ...(sponsor.uplineChain || [])];
}

async function incrementUplineCounters(uplineChain) {
  if (!uplineChain.length) return;
  const directSponsorId = uplineChain[0];
  await User.updateOne({ _id: directSponsorId }, { $inc: { directReferralsCount: 1 } });
  await User.updateMany({ _id: { $in: uplineChain } }, { $inc: { teamSize: 1 } });
}

module.exports = { generateReferralCode, resolveSponsor, buildUplineChain, incrementUplineCounters };
