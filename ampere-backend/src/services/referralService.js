const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Counter = require('../models/Counter');

const REFERRAL_PREFIX = 'AMP';
const REFERRAL_DIGITS = 4; // AMP0001..AMP9999, then AMP10000 and up
const COUNTER_ID = 'referralCode';

let counterSeeded = false;

// First use per process: make sure the counter is at least the highest AMP number already
// issued (e.g. codes created before the counter existed), so numbering continues from there.
async function seedCounterFromExistingCodes() {
  if (counterSeeded) return;
  const existing = await User.find({ referralCode: new RegExp(`^${REFERRAL_PREFIX}\\d+$`) })
    .select('referralCode')
    .lean();
  const max = existing.reduce((m, u) => Math.max(m, Number(u.referralCode.slice(REFERRAL_PREFIX.length))), 0);
  await Counter.updateOne({ _id: COUNTER_ID }, { $max: { seq: max } }, { upsert: true });
  counterSeeded = true;
}

/** Next sequential referral code: AMP0001, AMP0002, ... (atomic, safe under concurrent signups). */
async function generateReferralCode() {
  await seedCounterFromExistingCodes();
  for (let attempt = 0; attempt < 10; attempt++) {
    const { seq } = await Counter.findOneAndUpdate(
      { _id: COUNTER_ID },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const code = `${REFERRAL_PREFIX}${String(seq).padStart(REFERRAL_DIGITS, '0')}`;
    const taken = await User.exists({ referralCode: code });
    if (!taken) return code;
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

/**
 * Creates a distributor under `sponsor` (null = top-level ID) with the next AMP referral
 * code, and updates the upline's direct/team counters. Shared by app signup and admin
 * "Add User".
 */
async function createMember({ name, email, password, phone, sponsor }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const uplineChain = buildUplineChain(sponsor);
  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    role: 'customer',
    referralCode: await generateReferralCode(),
    sponsor: sponsor ? sponsor._id : null,
    uplineChain,
  });
  await incrementUplineCounters(uplineChain);
  return user;
}

module.exports = { generateReferralCode, resolveSponsor, buildUplineChain, incrementUplineCounters, createMember };
