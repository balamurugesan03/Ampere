/**
 * End-to-end MLM flow check on dummy data. Runs against a SEPARATE database
 * (<your db>_mlm_test, or MLM_TEST_MONGODB_URI) which it wipes first - never your real DB.
 *
 *   npm run test:mlm-flow
 *
 * Stage 1: Company ID -> 15 direct legs -> each leg built down to 10 levels (2-3 per node).
 * Stage 2: one paid order per ID (100..500 PV): 10% self purchase for the buyer, and the
 *          Company ID's development income at the buyer's level (1..10).
 * Stage 3: Company ID rank auto-upgrades at 5k / 10k / 25k / 50k team BV
 *          (Seeder / Planter / Performer / Star Performer).
 * Stage 4: leg heads pushed to 50k team PV one at a time -> each becomes Star Performer and
 *          the Company ID moves Bronze Star -> Silver Star -> Gold Star -> ... ; at every
 *          rank change a payout run checks the pools (Gold Ornaments Savings Fund = 2% of
 *          the month's company PV, shared by eligible Star Performers).
 *
 * Demo mode loads the same dummy tree into the REAL database (MONGODB_URI) so it shows up in
 * the admin panel. It never wipes: it only deletes and rebuilds its own @demo.local users and
 * their orders/ledger rows, and skips payout runs (run that from the admin Payouts page).
 *
 *   npm run seed:mlm-demo              # all 4 stages (Company ends at Diamond)
 *   npm run seed:mlm-demo -- --upto=3  # stop once Company is Star Performer, so the leg
 *                                      # upgrades can be shown live via admin "Grant PV"
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const MonthlyPV = require('../models/MonthlyPV');
const ManualPVGrant = require('../models/ManualPVGrant');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const MLMSettings = require('../models/MLMSettings');
const RankDefinition = require('../models/RankDefinition');
const CommissionTransaction = require('../models/CommissionTransaction');
const { rankSeeds } = require('../seed');
const { creditOrderCommissions } = require('../services/commissionService');
const { runMonthlyPayout, voidPayoutRun, computeTotalCompanyPV } = require('../services/payoutRunService');
const { buildUplineChain, incrementUplineCounters } = require('../services/referralService');
const { periodOf } = require('../utils/period');

const LEGS = 15;
const DEPTH = 10;
const PV_STEPS = [100, 200, 300, 400, 500];
const COMPANY_OWN_PV = 1000; // keeps the Company ID PGPV-qualified (threshold 1000) from order #1
const PUMP_PV = 5000;
const STAR_PERFORMER_BV = 50000;

const DEMO = process.argv.includes('--demo');
const UPTO = Number((process.argv.find((a) => a.startsWith('--upto=')) || '--upto=4').split('=')[1]);
const DEMO_EMAIL_DOMAIN = 'demo.local';
const DEMO_PASSWORD = 'Demo@1234';
let passwordHash = 'x';

function testDbUri() {
  if (process.env.MLM_TEST_MONGODB_URI) return process.env.MLM_TEST_MONGODB_URI;
  const m = /^(mongodb(?:\+srv)?:\/\/[^/]+)\/?([^?]*)(\?.*)?$/.exec(process.env.MONGODB_URI || '');
  if (!m) throw new Error('Set MONGODB_URI or MLM_TEST_MONGODB_URI');
  return `${m[1]}/${m[2] || 'ampere'}_mlm_test${m[3] || ''}`;
}

const results = { pass: 0, fail: 0, failures: [] };
function check(ok, label) {
  if (ok) results.pass++;
  else {
    results.fail++;
    results.failures.push(label);
    console.log(`   FAIL  ${label}`);
  }
  return ok;
}
const money = (n) => Math.round(n * 100) / 100;
const near = (a, b) => Math.abs(a - b) < 0.01;

let seq = 0;
async function createMember(name, sponsor) {
  seq++;
  const uplineChain = buildUplineChain(sponsor);
  const user = await User.create({
    name,
    email: DEMO ? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@${DEMO_EMAIL_DOMAIN}` : `mlm${seq}@test.local`,
    passwordHash,
    role: 'customer',
    referralCode: `${DEMO ? 'DEMO' : 'T'}${String(seq).padStart(4, '0')}`,
    sponsor: sponsor ? sponsor._id : null,
    uplineChain,
  });
  await incrementUplineCounters(uplineChain);
  return user;
}

let product;
let settings;
let company;
let totalPurchasedPV = 0;

async function purchase(user, pv) {
  const order = await Order.create({
    user: user._id,
    items: [{ product: product._id, name: product.name, price: pv, pv, qty: 1 }],
    address: { contactName: user.name, phone: '9999999999', line: 'Test', city: 'Test', state: 'TN', pincode: '600001' },
    subtotal: pv,
    total: pv,
    paymentMethod: 'COD',
    paymentStatus: 'paid',
    paidAt: new Date(),
  });
  await creditOrderCommissions(order);
  order.commissionsCredited = true;
  await order.save();
  totalPurchasedPV += pv;
  return order;
}

function levelUnderCompany(user) {
  const idx = (user.uplineChain || []).findIndex((a) => String(a) === String(company._id));
  return idx === -1 ? null : idx + 1;
}

// Stage 2 checks for one order: buyer's 10% self purchase, Company ID's development income
// at the right level/percent, and every other upline development entry has the right amount.
async function verifyOrderIncome(order, buyer, pv) {
  const entries = await CommissionTransaction.find({ sourceOrder: order._id }).lean();
  const self = entries.filter((e) => e.type === 'self_purchase' && String(e.user) === String(buyer._id));
  const expectedSelf = (pv * settings.selfPurchasePercent * settings.pvToInrRate) / 100;
  check(self.length === 1 && near(self[0].amount, expectedSelf), `${buyer.name}: self purchase ${expectedSelf} for ${pv} PV (got ${self.map((e) => e.amount)})`);

  const level = levelUnderCompany(buyer);
  if (level && level <= 10) {
    const expected = (pv * settings.teamLevelPercents[level - 1] * settings.pvToInrRate) / 100;
    const got = entries.filter((e) => e.type === 'team_level' && String(e.user) === String(company._id));
    check(
      got.length === 1 && got[0].level === level && near(got[0].amount, expected),
      `Company dev income from ${buyer.name} (L${level}, ${pv} PV): expected ${expected}, got ${got.map((e) => `L${e.level}:${e.amount}`)}`
    );
  }

  for (const e of entries.filter((x) => x.type === 'team_level')) {
    const idx = buyer.uplineChain.findIndex((a) => String(a) === String(e.user));
    const expected = (pv * settings.teamLevelPercents[idx] * settings.pvToInrRate) / 100;
    check(idx + 1 === e.level && near(e.amount, expected), `Dev income L${e.level} to ${e.user} on ${buyer.name}'s order: ${e.amount} vs ${expected}`);
  }
}

async function expectedGpvRank(user) {
  const u = await User.findById(user._id);
  const ranks = rankSeeds.filter((r) => r.ruleType === 'gpv_threshold').sort((a, b) => b.sortOrder - a.sortOrder);
  const hit = ranks.find((r) => u.cumulativeTeamPV >= r.criteria.minCumulativeTeamPV);
  return { u, name: hit ? hit.name : null };
}

// Highest count-based rank reachable with `legs` Star Performer legs (Star Performer if none).
function expectedCountRank(legs) {
  const hits = rankSeeds
    .filter((r) => r.ruleType === 'count_based' && r.countCriteria.requiredRankName === 'Star Performer')
    .filter((r) => legs >= r.countCriteria.requiredCount)
    .sort((a, b) => b.sortOrder - a.sortOrder);
  return hits.length ? hits[0].name : 'Star Performer';
}

// Runs the month's payout, checks the Company ID got exactly the pools its rank allows at
// the right per-head amount (Gold Ornaments Savings Fund in particular), then voids the run
// unless `keep` - so later checkpoints can re-run the same month.
async function payoutCheckpoint(admin, label, { keep = false } = {}) {
  const period = periodOf(new Date());
  const companyPV = await computeTotalCompanyPV(period);
  check(companyPV === totalPurchasedPV, `[${label}] company PV for ${period} = ${companyPV}, purchases = ${totalPurchasedPV}`);

  const run = await runMonthlyPayout(period, admin._id);
  const c = await User.findById(company._id);
  const credits = await CommissionTransaction.find({ payoutRun: run._id, user: company._id, type: 'bonus_pool' }).lean();
  const creditedKeys = credits.map((e) => e.poolKey).sort();
  const expectedKeys = settings.bonusPools.filter((p) => c.currentRankSortOrder >= p.minRankSortOrder).map((p) => p.key).sort();
  check(
    JSON.stringify(creditedKeys) === JSON.stringify(expectedKeys),
    `[${label}] Company (${c.currentRank}) pools: expected ${expectedKeys.join(',')} got ${creditedKeys.join(',')}`
  );

  const gold = run.pools.find((p) => p.key === 'goldCoin');
  const goldPool = settings.bonusPools.find((p) => p.key === 'goldCoin');
  const spCount = await User.countDocuments({ role: 'customer', currentRankSortOrder: { $gte: goldPool.minRankSortOrder } });
  const expectedPool = (companyPV * settings.pvToInrRate * 2) / 100;
  const companyGold = credits.find((e) => e.poolKey === 'goldCoin');
  check(near(gold.poolAmountInr, expectedPool), `[${label}] Gold Ornaments pool = 2% of ${companyPV} = ${expectedPool} (got ${gold.poolAmountInr})`);
  check(gold.qualifyingUserCount === spCount, `[${label}] Gold Ornaments qualifiers ${gold.qualifyingUserCount} vs Star Performer+ members ${spCount}`);
  check(companyGold && near(companyGold.amount, expectedPool / spCount), `[${label}] Company Gold Ornaments share ${companyGold?.amount} vs ${expectedPool}/${spCount}`);

  console.log(
    `   payout: companyPV=${companyPV}  ${c.currentRank}  gold pool ${money(gold.poolAmountInr)} / ${gold.qualifyingUserCount} = ${money(gold.perUserAmount)}  pools: ${creditedKeys.join(', ')}`
  );
  if (!keep) await voidPayoutRun(run._id, admin._id);
}

// Test mode: fresh throwaway DB with its own ranks/settings/product/admin.
async function setupTestDb() {
  await mongoose.connect(testDbUri());
  console.log(`Test DB: ${mongoose.connection.host}/${mongoose.connection.name} (wiping)`);
  await mongoose.connection.dropDatabase();
  await Promise.all([User.init(), Order.init(), CommissionTransaction.init(), RankDefinition.init()]);

  await RankDefinition.insertMany(rankSeeds);
  settings = await MLMSettings.getSingleton();
  const category = await Category.create({ name: 'Test' });
  product = await Product.create({ name: 'Test Product', price: 100, mrp: 100, pv: 100, category: category._id });
  return User.create({ name: 'Admin', email: 'admin@test.local', passwordHash: 'x', role: 'admin' });
}

// Demo mode: the real DB. Removes only a previous demo tree (users on DEMO_EMAIL_DOMAIN and
// everything they generated), reuses the existing rank chart and a real product.
async function setupDemoDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Demo DB: ${mongoose.connection.host}/${mongoose.connection.name} (keeping existing data)`);

  const escaped = DEMO_EMAIL_DOMAIN.replace('.', '\\.');
  const oldIds = (await User.find({ email: new RegExp(`@${escaped}$`) }).select('_id')).map((u) => u._id);
  if (oldIds.length) {
    const oldOrders = (await Order.find({ user: { $in: oldIds } }).select('_id')).map((o) => o._id);
    await CommissionTransaction.deleteMany({ $or: [{ user: { $in: oldIds } }, { sourceOrder: { $in: oldOrders } }] });
    await Promise.all([
      Order.deleteMany({ _id: { $in: oldOrders } }),
      MonthlyPV.deleteMany({ user: { $in: oldIds } }),
      ManualPVGrant.deleteMany({ user: { $in: oldIds } }),
    ]);
    await User.deleteMany({ _id: { $in: oldIds } });
    console.log(`   removed previous demo data: ${oldIds.length} users, ${oldOrders.length} orders`);
  }

  if (!(await RankDefinition.countDocuments())) await RankDefinition.insertMany(rankSeeds);
  settings = await MLMSettings.getSingleton();
  const gold = settings.bonusPools.find((p) => p.key === 'goldCoin');
  if (gold && (gold.minRankSortOrder !== 4 || gold.label !== 'Gold Ornaments Savings Fund')) {
    gold.label = 'Gold Ornaments Savings Fund';
    gold.minRankSortOrder = 4;
    await settings.save();
    console.log('   updated goldCoin pool -> Gold Ornaments Savings Fund, from Star Performer');
  }

  product = await Product.findOne().sort({ createdAt: 1 });
  if (!product) throw new Error('No products in the DB - run npm run seed first');
  passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return null;
}

async function main() {
  const admin = DEMO ? await setupDemoDb() : await setupTestDb();

  // ---- Stage 1: tree ----
  console.log('\n== Stage 1: Company ID + 15 legs x 10 levels ==');
  company = await createMember(DEMO ? 'Company ID' : 'COMPANY', null);
  const legHeads = [];
  const legLeaf = []; // a level-2 non-spine member per leg, used to pump that leg in stage 4
  const all = [];
  for (let leg = 1; leg <= LEGS; leg++) {
    const head = await createMember(`L${leg}-1`, company);
    legHeads.push(head);
    all.push(head);
    let spine = head;
    for (let depth = 2; depth <= DEPTH; depth++) {
      const width = (leg + depth) % 2 === 0 ? 2 : 3;
      const kids = [];
      for (let k = 0; k < width; k++) {
        spine = await User.findById(spine._id);
        kids.push(await createMember(`L${leg}-${depth}${String.fromCharCode(97 + k)}`, spine));
      }
      all.push(...kids);
      if (depth === 2) legLeaf.push(kids[1]);
      spine = kids[0];
    }
  }
  const c0 = await User.findById(company._id);
  const maxLevel = Math.max(...all.map(levelUnderCompany));
  console.log(`   members: ${all.length}, company directs: ${c0.directReferralsCount}, team: ${c0.teamSize}, deepest level: ${maxLevel}`);
  check(c0.directReferralsCount === LEGS, `Company has ${LEGS} directs`);
  check(c0.teamSize === all.length, 'Company teamSize = all members');
  check(maxLevel === DEPTH, `Tree reaches level ${DEPTH}`);

  // ---- Stage 2 + 3: purchases, income, company rank by BV ----
  console.log('\n== Stage 2/3: purchase per ID, income + Company rank by team BV ==');
  const order0 = await purchase(company, COMPANY_OWN_PV);
  await verifyOrderIncome(order0, company, COMPANY_OWN_PV);

  let lastRank = null;
  const incomeByLevel = Array(11).fill(0);
  for (let i = 0; i < all.length; i++) {
    const buyer = all[i];
    const pv = PV_STEPS[i % PV_STEPS.length];
    const order = await purchase(buyer, pv);
    await verifyOrderIncome(order, buyer, pv);
    incomeByLevel[levelUnderCompany(buyer)] += (pv * settings.teamLevelPercents[levelUnderCompany(buyer) - 1]) / 100;

    const { u, name } = await expectedGpvRank(company);
    if (u.currentRank !== lastRank) {
      console.log(`   team BV ${u.cumulativeTeamPV} -> Company rank ${u.currentRank}`);
      lastRank = u.currentRank;
    }
    check(u.currentRank === name, `Company rank at ${u.cumulativeTeamPV} BV: expected ${name}, got ${u.currentRank}`);
  }
  const devRows = await CommissionTransaction.aggregate([
    { $match: { user: company._id, type: 'team_level' } },
    { $group: { _id: '$level', amount: { $sum: '$amount' }, n: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  console.log('   Company development income by level:');
  for (const r of devRows) {
    console.log(`     L${r._id}: ${r.n} orders, Rs ${money(r.amount)}`);
    check(near(r.amount, incomeByLevel[r._id]), `Company L${r._id} dev income total ${r.amount} vs ${incomeByLevel[r._id]}`);
  }
  check(devRows.length === DEPTH, `Company earned development income from all ${DEPTH} levels`);
  for (let leg = 0; leg < LEGS; leg++) {
    const legIds = [legHeads[leg]._id, ...(await User.find({ uplineChain: legHeads[leg]._id }).select('_id')).map((u) => u._id)];
    const legOrders = await Order.find({ user: { $in: legIds } }).select('_id');
    const n = await CommissionTransaction.countDocuments({ user: company._id, type: 'team_level', sourceOrder: { $in: legOrders.map((o) => o._id) } });
    check(n === legOrders.length, `Leg ${leg + 1}: Company dev income on ${n}/${legOrders.length} orders`);
  }
  const cSP = await User.findById(company._id);
  check(cSP.currentRank === 'Star Performer', `Company is Star Performer before stage 4 (is ${cSP.currentRank})`);
  check((await User.countDocuments({ uplineChain: company._id, currentRankSortOrder: { $gte: 4 } })) === 0, 'No leg is Star Performer yet');
  if (!DEMO) await payoutCheckpoint(admin, 'Company = Star Performer');

  // ---- Stage 4: legs become Star Performer one by one ----
  if (UPTO >= 4) console.log('\n== Stage 4: legs -> Star Performer, Company count-based ranks ==');
  for (let k = 0; k < LEGS && UPTO >= 4; k++) {
    let head = await User.findById(legHeads[k]._id);
    while (head.cumulativeTeamPV < STAR_PERFORMER_BV) {
      await purchase(legLeaf[k], PUMP_PV);
      head = await User.findById(legHeads[k]._id);
    }
    const c = await User.findById(company._id);
    const expected = expectedCountRank(k + 1);
    console.log(`   leg ${k + 1} (${head.name}) BV ${head.cumulativeTeamPV} -> ${head.currentRank}; Company -> ${c.currentRank}`);
    check(head.currentRank === 'Star Performer', `Leg ${k + 1} head is Star Performer (is ${head.currentRank})`);
    check(c.currentRank === expected, `After ${k + 1} SP legs Company should be ${expected}, is ${c.currentRank}`);
    if (!DEMO) await payoutCheckpoint(admin, `${k + 1} SP legs`, { keep: k === LEGS - 1 });
  }

  console.log(`\n== Result: ${results.pass} passed, ${results.fail} failed ==`);
  if (DEMO) {
    console.log(`Demo logins (password ${DEMO_PASSWORD}): company.id@${DEMO_EMAIL_DOMAIN}, l1.1@${DEMO_EMAIL_DOMAIN} ... l15.1@${DEMO_EMAIL_DOMAIN}`);
  }
  if (results.fail) console.log(results.failures.slice(0, 50).map((f) => ` - ${f}`).join('\n'));
  await mongoose.disconnect();
  process.exit(results.fail ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
