/**
 * Dummy purchases for REAL users (the ones added from the admin panel / app) in the REAL
 * database (MONGODB_URI), then checks that PV, development (level) income, rank and wallet
 * all come out right. Expected values are worked out here independently from the MLM rules
 * (MLMSettings + RankDefinition in the DB) and compared with what the backend stored.
 *
 *   npm run test:user-purchases                              # show the plan only, changes nothing
 *   npm run test:user-purchases -- --yes                     # all customers buy once (100..500 PV)
 *   npm run test:user-purchases -- --users=AMP0002,G8KGTVHC --pv=1000,500 --yes
 *   npm run test:user-purchases -- --tree=AMPEREROOT --rounds=2 --yes   # that user + downline
 *   npm run test:user-purchases -- --check                   # audit only: rank vs rules, wallet vs ledger
 *   npm run test:user-purchases -- --erase                   # remove the dummy orders and undo their effects
 *
 * --users / --tree take referral codes or emails. --pv is a list cycled over the orders
 * (default 100,200,300,400,500). --rounds = orders per user (default 1). --db=<uri> runs
 * against another database instead of MONGODB_URI (e.g. a copy from npm run copy:live-db).
 *
 * Dummy orders are tagged deliverySlot = 'DUMMY-TEST' so --erase can find them. --erase
 * removes their ledger rows (and the wallet money), MonthlyPV and team PV, and restores
 * each user's rank to what it was before the first dummy run (kept in
 * .dummy-purchase-snapshot.<db>.json). Payout-run (bonus pool) credits are not undone - void
 * those runs from the admin Payouts page first.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const MonthlyPV = require('../models/MonthlyPV');
const MLMSettings = require('../models/MLMSettings');
const RankDefinition = require('../models/RankDefinition');
const CommissionTransaction = require('../models/CommissionTransaction');
const { creditOrderCommissions } = require('../services/commissionService');
const { recomputeRank } = require('../services/rankService');
const { periodOf } = require('../utils/period');

const DUMMY_TAG = 'DUMMY-TEST';
let SNAPSHOT_FILE; // per database, set after connecting

const args = process.argv.slice(2);
const arg = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};
const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const ERASE = args.includes('--erase');
const CHECK_ONLY = args.includes('--check');
const YES = args.includes('--yes');
const PV_STEPS = list(arg('pv')).map(Number);
if (!PV_STEPS.length) PV_STEPS.push(100, 200, 300, 400, 500);
const ROUNDS = Number(arg('rounds') || 1);

const results = { pass: 0, fail: 0, warn: 0, failures: [], warnings: [] };
function check(ok, label) {
  if (ok) results.pass++;
  else {
    results.fail++;
    results.failures.push(label);
    console.log(`   FAIL  ${label}`);
  }
  return ok;
}
function warn(label) {
  results.warn++;
  results.warnings.push(label);
}
const near = (a, b) => Math.abs(a - b) < 0.01;
const rs = (n) => `Rs ${Math.round(n * 100) / 100}`;
const pad = (s, n) => String(s ?? '-').padEnd(n);

let settings;
let ranks; // sortOrder desc
let rankByName;
let spSort; // Star Performer sortOrder: compression wall + gate for count-based ranks
const period = periodOf(new Date());
const label = new Map(); // id -> "CODE name"
const tag = (id) => label.get(String(id)) || String(id);

async function loadRules() {
  settings = await MLMSettings.getSingleton();
  ranks = await RankDefinition.find({ active: true }).sort({ sortOrder: -1 }).lean();
  rankByName = new Map(ranks.map((r) => [r.name, r]));
  spSort = rankByName.get('Star Performer')?.sortOrder ?? Infinity;
}

async function personalPV(userId) {
  const s = await MonthlyPV.findOne({ user: userId, period }).lean();
  return s?.personalPV || 0;
}

// This month's downline PV, not descending below anyone Star Performer-or-above (their own
// PV counts, their subtree doesn't).
async function compressedTeamPV(rootId) {
  let total = 0;
  let frontier = [rootId];
  const seen = new Set([String(rootId)]);
  while (frontier.length) {
    const kids = await User.find({ sponsor: { $in: frontier } }).select('_id currentRankSortOrder').lean();
    const next = [];
    for (const k of kids) {
      if (seen.has(String(k._id))) continue;
      seen.add(String(k._id));
      total += await personalPV(k._id);
      if ((k.currentRankSortOrder || 0) < spSort) next.push(k._id);
    }
    frontier = next;
  }
  return total;
}

async function pgpv(userId) {
  return (await personalPV(userId)) + (await compressedTeamPV(userId));
}

// Direct legs of userId that hold (head or anyone below) a member ranked >= minSort.
async function qualifyingLegs(userId, minSort) {
  const directs = await User.find({ sponsor: userId }).select('_id currentRankSortOrder').lean();
  let n = 0;
  for (const d of directs) {
    if ((d.currentRankSortOrder || 0) >= minSort) n++;
    else if (await User.exists({ uplineChain: d._id, currentRankSortOrder: { $gte: minSort } })) n++;
  }
  return n;
}

async function expectedRank(user) {
  let matched = null;
  for (const r of ranks) {
    if (r.ruleType !== 'gpv_threshold') continue;
    if ((user.cumulativeTeamPV || 0) < (r.criteria?.minCumulativeTeamPV || 0)) continue;
    if (r.criteria?.minMonthlyPGPV > 0 && (await pgpv(user._id)) < r.criteria.minMonthlyPGPV) continue;
    matched = r;
    break;
  }
  if (matched && matched.sortOrder >= spSort) {
    for (const r of ranks) {
      if (r.ruleType !== 'count_based') continue;
      const req = rankByName.get(r.countCriteria?.requiredRankName);
      if (!req) continue;
      if ((await qualifyingLegs(user._id, req.sortOrder)) >= (r.countCriteria.requiredCount || 0)) {
        matched = r;
        break;
      }
    }
  }
  return matched;
}

async function isQualifiedBeforeOrder(sponsorId, buyer, levelIdx, pv) {
  const threshold = settings.pgpvThreshold || 0;
  if (threshold <= 0) return true;
  if (settings.pgpvScope !== 'self_plus_team') return (await personalPV(sponsorId)) >= threshold;
  // The new order's PV reaches this sponsor unless someone between them is a compression wall.
  const between = buyer.uplineChain.slice(0, levelIdx);
  const walls = await User.countDocuments({ _id: { $in: between }, currentRankSortOrder: { $gte: spSort } });
  return (await pgpv(sponsorId)) + (walls ? 0 : pv) >= threshold;
}

async function ledgerSum(userId) {
  const [r] = await CommissionTransaction.aggregate([{ $match: { user: userId } }, { $group: { _id: null, s: { $sum: '$amount' } } }]);
  return r ? r.s : 0;
}

async function snapshot(ids) {
  const snap = new Map();
  for (const u of await User.find({ _id: { $in: ids } }).lean()) {
    snap.set(String(u._id), {
      wallet: u.walletBalance || 0,
      teamPV: u.cumulativeTeamPV || 0,
      monthPV: await personalPV(u._id),
      rank: u.currentRank || null,
      rankSort: u.currentRankSortOrder || 0,
      rankAchievedAt: u.rankAchievedAt || null,
      ledger: await ledgerSum(u._id),
    });
  }
  return snap;
}

// Keeps the earliest rank per user across runs, so --erase can put ranks back.
function saveRankSnapshot(snap) {
  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
  } catch {
    // first run
  }
  for (const [id, s] of snap) {
    if (!saved[id]) saved[id] = { rank: s.rank, rankSort: s.rankSort, rankAchievedAt: s.rankAchievedAt };
  }
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(saved, null, 2));
}

async function selectBuyers() {
  const find = (keys) =>
    User.find({
      $or: [{ referralCode: { $in: keys.map((k) => k.toUpperCase()) } }, { email: { $in: keys.map((k) => k.toLowerCase()) } }],
    });
  const users = list(arg('users'));
  const tree = arg('tree');
  let buyers;
  if (users.length) {
    buyers = await find(users);
    const found = new Set(buyers.flatMap((b) => [b.referralCode, b.email]));
    const missing = users.filter((k) => !found.has(k.toUpperCase()) && !found.has(k.toLowerCase()));
    if (missing.length) throw new Error(`Users not found: ${missing.join(', ')}`);
  } else if (tree) {
    const [root] = await find([tree]);
    if (!root) throw new Error(`User not found: ${tree}`);
    buyers = [root, ...(await User.find({ uplineChain: root._id }))];
  } else {
    buyers = await User.find({ role: 'customer', referralCode: { $exists: true, $ne: null }, email: { $not: /@demo\.local$/ } });
  }
  return buyers.filter((b) => b.role === 'customer').sort((a, b) => (a.uplineChain || []).length - (b.uplineChain || []).length);
}

async function remember(ids) {
  for (const u of await User.find({ _id: { $in: ids } }).select('name referralCode').lean()) {
    label.set(String(u._id), `${u.referralCode || '?'} ${u.name}`);
  }
}

async function placeDummyOrder(buyer, pv, product) {
  const order = await Order.create({
    user: buyer._id,
    items: [{ product: product._id, name: product.name, price: pv, pv, qty: 1 }],
    address: { contactName: buyer.name, phone: '9999999999', line: DUMMY_TAG, city: 'Test', state: 'TN', pincode: '600001' },
    deliverySlot: DUMMY_TAG,
    subtotal: pv,
    total: pv,
    paymentMethod: 'COD',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    paidAt: new Date(),
  });
  await creditOrderCommissions(order);
  order.commissionsCredited = true;
  await order.save();
  return order;
}

// Final rank / PV / wallet checks over `ids`. `before`/`expected` are null in --check mode.
async function verifyUsers(ids, before, expected) {
  const rows = [];
  for (const u of await User.find({ _id: { $in: ids } }).lean()) {
    const id = String(u._id);
    const b = before?.get(id);
    const e = expected?.get(id);
    const name = tag(id);
    const monthPV = await personalPV(u._id);
    const wallet = u.walletBalance || 0;
    const ledger = await ledgerSum(u._id);

    if (b && e) {
      check(monthPV - b.monthPV === e.ownPV, `${name}: month PV +${monthPV - b.monthPV}, expected +${e.ownPV}`);
      check(u.cumulativeTeamPV - b.teamPV === e.teamPV, `${name}: team PV +${u.cumulativeTeamPV - b.teamPV}, expected +${e.teamPV}`);
      check(near(wallet - b.wallet, e.income), `${name}: wallet +${rs(wallet - b.wallet)}, expected +${rs(e.income)}`);
    }
    // Wallet must equal the sum of the user's ledger (what the app's transaction list shows).
    if (!near(wallet, ledger)) {
      const msg = `${name}: wallet ${rs(wallet)} != ledger total ${rs(ledger)}`;
      if (b && near(b.wallet - b.ledger, wallet - ledger)) warn(`${msg} (already off before this run)`);
      else if (b) check(false, msg);
      else warn(msg);
    }

    const exp = await expectedRank(u);
    const expName = exp ? exp.name : null;
    const got = u.currentRank || null;
    if (got !== expName) {
      const msg = `${name}: rank is ${got || 'none'}, rules say ${expName || 'none'} (team PV ${u.cumulativeTeamPV}, PGPV ${await pgpv(u._id)})`;
      // Ranks are never downgraded on a purchase, so an older higher rank is only a warning.
      if (b && got === b.rank && (u.currentRankSortOrder || 0) > (exp?.sortOrder || 0)) warn(`${msg} - held from before`);
      else if (b) check(false, msg);
      else warn(msg);
    } else results.pass++;

    rows.push({ u, b, e, monthPV, wallet, expName });
  }

  console.log(
    `\n   ${pad('User', 30)}${pad('Bought PV', 11)}${pad('Month PV', 10)}${pad('Team PV', 18)}${pad('Rank', 34)}Wallet`
  );
  rows.sort((x, y) => (x.u.uplineChain || []).length - (y.u.uplineChain || []).length);
  for (const { u, b, e, monthPV, wallet } of rows) {
    const teamPV = b ? `${b.teamPV} -> ${u.cumulativeTeamPV}` : u.cumulativeTeamPV;
    const rank = b ? `${b.rank || 'none'} -> ${u.currentRank || 'none'}` : u.currentRank || 'none';
    const w = b ? `${rs(b.wallet)} -> ${rs(wallet)} (+${rs(wallet - b.wallet)})` : rs(wallet);
    console.log(`   ${pad(tag(u._id).slice(0, 29), 30)}${pad(e ? e.ownPV : '', 11)}${pad(monthPV, 10)}${pad(teamPV, 18)}${pad(rank, 34)}${w}`);
  }
}

async function runPurchases() {
  const buyers = await selectBuyers();
  if (!buyers.length) throw new Error('No users selected');
  const product = await Product.findOne().sort({ createdAt: 1 });
  if (!product) throw new Error('No products in the DB - run npm run seed first');

  const plan = [];
  for (let r = 0; r < ROUNDS; r++) for (const b of buyers) plan.push({ buyer: b, pv: PV_STEPS[plan.length % PV_STEPS.length] });
  const affected = [...new Set(buyers.flatMap((b) => [String(b._id), ...(b.uplineChain || []).map(String)]))];
  await remember(affected);

  console.log(`Period ${period}, PV->Rs rate ${settings.pvToInrRate}, self ${settings.selfPurchasePercent}%, levels ${settings.teamLevelPercents.join('/')}%`);
  console.log(`PGPV gate: ${settings.pgpvThreshold} PV (${settings.pgpvScope}) - an upline below this this month gets no level income\n`);
  console.log(`Plan: ${plan.length} dummy orders`);
  for (const p of plan) console.log(`   ${pad(tag(p.buyer._id), 32)} ${p.pv} PV`);
  if (!YES) {
    console.log('\nNothing changed. Add --yes to place these orders.');
    return;
  }

  const before = await snapshot(affected);
  saveRankSnapshot(before);
  const expected = new Map(affected.map((id) => [id, { ownPV: 0, teamPV: 0, income: 0 }]));

  console.log('\n== Orders ==');
  for (const { buyer, pv } of plan) {
    const chain = (buyer.uplineChain || []).slice(0, 10);
    const qualified = [];
    for (let i = 0; i < chain.length; i++) qualified.push(await isQualifiedBeforeOrder(chain[i], buyer, i, pv));

    const order = await placeDummyOrder(buyer, pv, product);
    const entries = await CommissionTransaction.find({ sourceOrder: order._id }).lean();
    const lines = [];

    const selfExp = (pv * settings.selfPurchasePercent * settings.pvToInrRate) / 100;
    const self = entries.filter((x) => x.type === 'self_purchase');
    check(
      self.length === 1 && String(self[0].user) === String(buyer._id) && near(self[0].amount, selfExp),
      `${tag(buyer._id)} ${pv} PV: self purchase should be ${rs(selfExp)}, got ${self.map((x) => rs(x.amount)).join(',') || 'none'}`
    );
    expected.get(String(buyer._id)).ownPV += pv;
    expected.get(String(buyer._id)).income += selfExp;

    const levels = entries.filter((x) => x.type === 'team_level');
    for (let i = 0; i < chain.length; i++) {
      const id = String(chain[i]);
      const percent = settings.teamLevelPercents[i] || 0;
      const amount = (pv * percent * settings.pvToInrRate) / 100;
      const got = levels.filter((x) => x.level === i + 1);
      expected.get(id).teamPV += pv;
      if (percent > 0 && qualified[i]) {
        expected.get(id).income += amount;
        check(
          got.length === 1 && String(got[0].user) === id && near(got[0].amount, amount),
          `${tag(buyer._id)} ${pv} PV: L${i + 1} ${tag(id)} should get ${rs(amount)}, got ${got.map((x) => `${tag(x.user)} ${rs(x.amount)}`).join(',') || 'nothing'}`
        );
        lines.push(`L${i + 1} ${tag(id).split(' ')[0]} ${rs(amount)}`);
      } else {
        check(!got.length, `${tag(buyer._id)} ${pv} PV: L${i + 1} ${tag(id)} is below the PGPV gate but got ${got.map((x) => rs(x.amount)).join(',')}`);
        lines.push(`L${i + 1} ${tag(id).split(' ')[0]} -- (PGPV < ${settings.pgpvThreshold})`);
      }
    }
    check(levels.every((x) => x.level >= 1 && x.level <= chain.length), `${tag(buyer._id)}: level income paid beyond the ${chain.length}-level upline`);
    // Upline beyond 10 levels still gets team PV
    for (const id of (buyer.uplineChain || []).slice(10)) expected.get(String(id)).teamPV += pv;

    console.log(`   ${tag(buyer._id)}  ${pv} PV  self ${rs(selfExp)}`);
    if (lines.length) console.log(`      ${lines.join('  |  ')}`);
    else console.log('      (no upline)');
  }

  console.log('\n== Users after the orders (PV / rank / wallet) ==');
  await verifyUsers(affected, before, expected);
}

async function runCheckOnly() {
  const buyers = await selectBuyers();
  const ids = [...new Set(buyers.map((b) => String(b._id)))];
  await remember(ids);
  console.log(`Audit of ${ids.length} users for ${period}: rank vs rules, wallet vs ledger (no changes)`);
  await verifyUsers(ids, null, null);
}

async function eraseDummyOrders() {
  const orders = await Order.find({ deliverySlot: DUMMY_TAG }).lean();
  if (!orders.length) {
    console.log('No dummy orders found');
    return;
  }
  const affected = new Set();
  for (const o of orders) {
    const pv = o.items.reduce((s, i) => s + (i.pv || 0) * i.qty, 0);
    const p = periodOf(o.paidAt || o.createdAt);
    for (const e of await CommissionTransaction.find({ sourceOrder: o._id }).lean()) {
      await User.updateOne({ _id: e.user }, { $inc: { walletBalance: -e.amount } });
      affected.add(String(e.user));
    }
    await CommissionTransaction.deleteMany({ sourceOrder: o._id });
    await MonthlyPV.updateOne({ user: o.user, period: p }, { $inc: { personalPV: -pv } });
    const buyer = await User.findById(o.user).select('uplineChain').lean();
    if (buyer?.uplineChain?.length) await User.updateMany({ _id: { $in: buyer.uplineChain } }, { $inc: { cumulativeTeamPV: -pv } });
    affected.add(String(o.user));
    (buyer?.uplineChain || []).forEach((id) => affected.add(String(id)));
  }
  await Order.deleteMany({ _id: { $in: orders.map((o) => o._id) } });
  await MonthlyPV.updateMany({ user: { $in: [...affected] } }, { $unset: { teamPVComputedAt: 1 } });

  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
  } catch {
    // no snapshot - fall back to recomputing from the rules
  }
  // Recompute from the rules (deepest first, so leg counts see the corrected lower ranks),
  // keeping a rank held before the dummy run if it is higher - live users may have earned a
  // rank from real orders placed meanwhile, which the recompute keeps.
  const users = await User.find({ _id: { $in: [...affected] } }).select('_id uplineChain').lean();
  users.sort((a, b) => (b.uplineChain || []).length - (a.uplineChain || []).length);
  let restored = 0;
  for (const { _id } of users) {
    await recomputeRank(_id, { period });
    const s = saved[String(_id)];
    const now = await User.findById(_id).select('currentRankSortOrder').lean();
    if (s && s.rankSort > (now.currentRankSortOrder || 0)) {
      await User.updateOne({ _id }, { $set: { currentRank: s.rank, currentRankSortOrder: s.rankSort, rankAchievedAt: s.rankAchievedAt } });
      restored++;
    }
  }
  fs.rmSync(SNAPSHOT_FILE, { force: true });
  console.log(`Removed ${orders.length} dummy orders; wallet, PV and team PV reversed for ${affected.size} users; ranks recomputed (${restored} kept from before the run)`);
}

async function main() {
  await mongoose.connect(arg('db') || process.env.MONGODB_URI);
  SNAPSHOT_FILE = path.join(__dirname, '..', '..', `.dummy-purchase-snapshot.${mongoose.connection.name}.json`);
  console.log(`DB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);
  await loadRules();

  if (ERASE) await eraseDummyOrders();
  else if (CHECK_ONLY) await runCheckOnly();
  else await runPurchases();

  if (!ERASE && (YES || CHECK_ONLY)) {
    console.log(`\n== Result: ${results.pass} passed, ${results.fail} failed, ${results.warn} warnings ==`);
    if (results.fail) console.log(results.failures.slice(0, 50).map((f) => ` FAIL ${f}`).join('\n'));
    if (results.warn) console.log(results.warnings.map((w) => ` WARN ${w}`).join('\n'));
  }
  await mongoose.disconnect();
  process.exit(results.fail ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
