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
  { name: 'Star Performer', sortOrder: 1, criteria: { minCumulativeTeamPV: 500, minDirectReferrals: 1, minTeamSize: 1 } },
  { name: 'Star Platinum', sortOrder: 2, criteria: { minCumulativeTeamPV: 2000, minDirectReferrals: 3, minTeamSize: 5 } },
  { name: 'Star Pearl', sortOrder: 3, criteria: { minCumulativeTeamPV: 5000, minDirectReferrals: 5, minTeamSize: 15 } },
  { name: 'Star Ruby', sortOrder: 4, criteria: { minCumulativeTeamPV: 15000, minDirectReferrals: 8, minTeamSize: 40 } },
  { name: 'Diamond', sortOrder: 5, criteria: { minCumulativeTeamPV: 40000, minDirectReferrals: 12, minTeamSize: 100 } },
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

  const ranksCreated = await upsertMissing(RankDefinition, rankSeeds, 'sortOrder');

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
