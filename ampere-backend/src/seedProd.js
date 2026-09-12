require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const PaymentSettings = require('./models/PaymentSettings');
const MLMSettings = require('./models/MLMSettings');
const RankDefinition = require('./models/RankDefinition');
const User = require('./models/User');

// Production seeder: idempotent, NEVER deletes. Safe to re-run.
// Seeds only what the app needs to function: rank definitions, the
// settings singletons, an admin user, and the MLM root distributor.
// No demo products / coupons / banners / customers.

const categorySeeds = [
  { name: 'Medicines', subtitle: 'Care you can trust', sortOrder: 1 },
  { name: 'Ayurveda', subtitle: 'Natural & Safe', sortOrder: 2 },
  { name: 'Personal Care', subtitle: 'Everyday essentials', sortOrder: 3 },
  { name: 'Nutrition', subtitle: 'Fuel your body', sortOrder: 4 },
  { name: 'Diabetes Care', subtitle: 'Manage with confidence', sortOrder: 5 },
  { name: 'Medical Devices', subtitle: 'Monitor at home', sortOrder: 6 },
  { name: 'Heart Care', subtitle: 'Stay heart healthy', sortOrder: 7 },
  { name: 'Bone Health', subtitle: 'Strength for life', sortOrder: 8 },
  { name: 'Baby Care', subtitle: 'Gentle & safe', sortOrder: 9 },
  { name: 'Fitness', subtitle: 'Move more', sortOrder: 10 },
];

const rankSeeds = [
  { name: 'Seeder', sortOrder: 1, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 5000 } },
  { name: 'Planter', sortOrder: 2, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 10000 } },
  { name: 'Performer', sortOrder: 3, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 25000 } },
  {
    name: 'Star Performer',
    sortOrder: 4,
    ruleType: 'gpv_threshold',
    criteria: { minCumulativeTeamPV: 50000, minMonthlyPGPV: 1000 },
  },
  { name: 'Bronze Star', sortOrder: 5, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 1 } },
  { name: 'Silver Star', sortOrder: 6, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 2 } },
  { name: 'Gold Star', sortOrder: 7, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 3 } },
  { name: 'Platinum', sortOrder: 8, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 4 } },
  { name: 'Star Platinum', sortOrder: 9, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 5 } },
  { name: 'Pearl', sortOrder: 10, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 6 } },
  { name: 'Star Pearl', sortOrder: 11, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 7 } },
  { name: 'Emerald', sortOrder: 12, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 8 } },
  { name: 'Star Emerald', sortOrder: 13, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 9 } },
  { name: 'Ruby', sortOrder: 14, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 10 } },
  { name: 'Star Ruby', sortOrder: 15, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 11 } },
  { name: 'Sapphire', sortOrder: 16, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 12 } },
  { name: 'Star Sapphire', sortOrder: 17, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 13 } },
  // Spec goes 13 -> 15, skipping 14 - implemented literally as given.
  { name: 'Diamond', sortOrder: 18, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 15 } },
  { name: 'Star Diamond', sortOrder: 19, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 3 } },
  { name: 'Crown Diamond', sortOrder: 20, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 6 } },
  { name: 'Ambassador', sortOrder: 21, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 9 } },
  { name: 'Crown Ambassador', sortOrder: 22, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 12 } },
  { name: 'Universal Crown Ambassador', sortOrder: 23, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 15 } },
  {
    name: 'Double Universal Crown Ambassador',
    sortOrder: 24,
    ruleType: 'count_based',
    countCriteria: { requiredRankName: 'Universal Crown Ambassador', requiredCount: 15 },
  },
];

const WEAK = new Set(['Admin@12345', 'RootPass@123', 'Test@1234', 'password', 'changeme', 'change-me']);

function requireStrongPassword(varName) {
  const value = process.env[varName];
  if (!value) {
    console.error(`Refusing to seed: ${varName} is not set. Put a strong value in the production .env.`);
    process.exit(1);
  }
  if (value.length < 10 || WEAK.has(value)) {
    console.error(`Refusing to seed: ${varName} is too weak. Use at least 10 chars and not a known default.`);
    process.exit(1);
  }
  return value;
}

// The old rank chart's sortOrders (1-5) collide with the new chart's, and old rank names
// (e.g. old "Star Performer" meant something different) must not linger alongside the new
// ones. If any existing rank still lacks `ruleType` (the old shape), this is a production DB
// seeded before the compensation-plan rewrite - require an explicit RESEED_RANKS=true so a
// destructive replace of RankDefinition never happens silently.
async function reseedRanksIfNeeded() {
  const oldShapeExists = await RankDefinition.findOne({ ruleType: { $exists: false } });
  if (!oldShapeExists) {
    return upsertMissing(RankDefinition, rankSeeds, 'sortOrder');
  }
  if (process.env.RESEED_RANKS !== 'true') {
    console.error(
      'RankDefinition still has old-shape rank documents (pre-compensation-plan-rewrite).\n' +
        'Set RESEED_RANKS=true to replace them with the new 24-tier chart. Refusing to proceed without it.'
    );
    process.exit(1);
  }
  await RankDefinition.deleteMany({});
  await RankDefinition.insertMany(rankSeeds);
  console.log(`- RESEED_RANKS=true: replaced RankDefinition with ${rankSeeds.length} new-shape ranks`);
  return rankSeeds.length;
}

async function upsertMissing(Model, docs, keyField) {
  let created = 0;
  for (const doc of docs) {
    const existing = await Model.findOne({ [keyField]: doc[keyField] });
    if (!existing) {
      await Model.create(doc);
      created += 1;
    }
  }
  return created;
}

async function ensureUser({ email, name, passwordEnvVar, extra }) {
  const normalized = email.toLowerCase();
  const existing = await User.findOne({ email: normalized });
  if (existing) {
    console.log(`- ${normalized} already exists, left untouched`);
    return existing;
  }
  const password = requireStrongPassword(passwordEnvVar);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: normalized, name, passwordHash, ...extra });
  console.log(`- created ${normalized} (password from ${passwordEnvVar})`);
  return user;
}

async function seed() {
  await connectDB();

  const ranksCreated = await reseedRanksIfNeeded();

  const categoryCount = await Category.countDocuments();
  let categoriesCreated = 0;
  if (categoryCount === 0) {
    await Category.insertMany(categorySeeds);
    categoriesCreated = categorySeeds.length;
  }

  // Creates the singletons with schema defaults if they do not exist; never overwrites.
  await MLMSettings.getSingleton();
  const payment = await PaymentSettings.getSingleton();
  if (!payment.upiId) {
    console.log('- PaymentSettings.upiId is empty; set the real UPI ID from the admin panel');
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@ampere.com';
  await ensureUser({
    email: adminEmail,
    name: 'Ampere Admin',
    passwordEnvVar: 'ADMIN_SEED_PASSWORD',
    extra: { role: 'admin' },
  });

  // Root distributor: bootstraps the mandatory-sponsor MLM tree (sponsor: null is only valid here).
  await ensureUser({
    email: 'root@ampere.internal',
    name: 'Ampere Root',
    passwordEnvVar: 'ROOT_SEED_PASSWORD',
    extra: { role: 'customer', referralCode: 'AMPEREROOT', sponsor: null, uplineChain: [] },
  });

  console.log(
    `\nDone. Ranks created: ${ranksCreated}/${rankSeeds.length}, categories created: ${categoriesCreated}.`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error('Prod seed failed', err);
  process.exit(1);
});
