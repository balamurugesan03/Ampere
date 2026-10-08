/**
 * READ-ONLY audit of every customer's PV, team PV, wallet and rank. Nothing is written to
 * the database. Everything is recomputed from the source records - paid orders, active
 * manual PV grants, the wallet ledger and the MLM rules (MLMSettings + RankDefinition) -
 * and compared with what is stored on each user. Results go to the console and to a CSV
 * the client can open in Excel (one row per user, with a Status and an Issues column).
 *
 *   npm run audit:users                         # live DB (MONGODB_URI)
 *   npm run audit:users -- --db=<uri>           # another DB, e.g. a copy from copy:live-db
 *   npm run audit:users -- --out=report.csv     # CSV path (default audit-reports/audit-<date>.csv)
 *
 * Checks:
 *   Tree     uplineChain matches the sponsor links
 *   Orders   every paid order was credited; ledger rows per order/grant have the right
 *            recipient and amount; level income replayed against the PGPV gate
 *   PV       MonthlyPV.personalPV per month = PV of the user's credited orders + active grants
 *   Team PV  cumulativeTeamPV = lifetime PV of everyone below the user
 *   Wallet   walletBalance = ledger total; payout debits = WalletPayout records
 *   Rank     currentRank vs the rank rules on the recomputed numbers
 *
 * FAIL = stored value is wrong. WARN = worth a look but can be legitimate (e.g. a rank held
 * from an earlier month, or MLM settings changed after an order was credited).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const MonthlyPV = require('../models/MonthlyPV');
const ManualPVGrant = require('../models/ManualPVGrant');
const WalletPayout = require('../models/WalletPayout');
const MLMSettings = require('../models/MLMSettings');
const RankDefinition = require('../models/RankDefinition');
const CommissionTransaction = require('../models/CommissionTransaction');
const { periodOf } = require('../utils/period');

const args = process.argv.slice(2);
const arg = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : null;
};

const near = (a, b) => Math.abs(a - b) < 0.01;
const money = (n) => Math.round(n * 100) / 100;
const orderPV = (o) => o.items.reduce((s, i) => s + (i.pv || 0) * i.qty, 0);

async function main() {
  await mongoose.connect(arg('db') || process.env.MONGODB_URI);
  console.log(`DB: ${mongoose.connection.host}/${mongoose.connection.name} (read-only audit)\n`);

  const settings = await MLMSettings.getSingleton();
  const ranks = await RankDefinition.find({ active: true }).sort({ sortOrder: -1 }).lean();
  const rankByName = new Map(ranks.map((r) => [r.name, r]));
  const spSort = rankByName.get('Star Performer')?.sortOrder ?? Infinity;
  const period = periodOf(new Date());

  const [users, orders, grants, ledger, monthly, payouts] = await Promise.all([
    User.find().select('-passwordHash -cart -wishlist -addresses').lean(),
    Order.find().lean(),
    ManualPVGrant.find().lean(),
    CommissionTransaction.find().lean(),
    MonthlyPV.find().lean(),
    WalletPayout.find().lean(),
  ]);

  const byId = new Map(users.map((u) => [String(u._id), u]));
  const name = (id) => {
    const u = byId.get(String(id));
    return u ? `${u.referralCode || '?'} ${u.name}` : String(id);
  };
  const issues = new Map(users.map((u) => [String(u._id), []]));
  const counts = { fail: 0, warn: 0 };
  const flag = (id, level, msg) => {
    counts[level === 'FAIL' ? 'fail' : 'warn']++;
    const list = issues.get(String(id));
    if (list) list.push(`${level}: ${msg}`);
    else console.log(`   ${level}  ${msg}`);
  };

  // --- Tree: uplineChain must be [sponsor, ...sponsor.uplineChain] ---
  const children = new Map(users.map((u) => [String(u._id), []]));
  for (const u of users) {
    if (u.sponsor && children.has(String(u.sponsor))) children.get(String(u.sponsor)).push(u);
    const sponsor = u.sponsor ? byId.get(String(u.sponsor)) : null;
    const want = sponsor ? [sponsor._id, ...(sponsor.uplineChain || [])].map(String) : [];
    const got = (u.uplineChain || []).map(String);
    if (want.join() !== got.join()) flag(u._id, 'FAIL', `upline chain does not match sponsor links (sponsor ${u.sponsor ? name(u.sponsor) : 'none'})`);
  }

  // --- PV sources: credited orders + active grants, as {user, pv, period, date, ...} ---
  const sources = [];
  for (const o of orders) {
    if (o.paymentStatus === 'paid' && !o.commissionsCredited && orderPV(o) > 0) {
      flag(o.user, 'FAIL', `order ${o._id} is paid but PV/income was never credited (${orderPV(o)} PV)`);
    }
    if (!o.commissionsCredited) continue;
    if (o.orderStatus === 'cancelled') flag(o.user, 'WARN', `order ${o._id} is cancelled but its PV/income is still counted`);
    const date = o.paidAt || o.updatedAt;
    sources.push({ key: String(o._id), kind: 'order', user: String(o.user), pv: orderPV(o), period: periodOf(date), date });
  }
  for (const g of grants) {
    if (g.status !== 'active') continue; // a revoked grant nets to zero
    sources.push({ key: String(g._id), kind: 'grant', user: String(g.user), pv: g.pv, period: periodOf(g.createdAt), date: g.createdAt });
  }
  sources.sort((a, b) => a.date - b.date);

  // --- Expected personal PV per user per month, and lifetime own PV ---
  const expMonthPV = new Map(); // `${user}|${period}` -> pv
  const ownLifetimePV = new Map();
  for (const s of sources) {
    const k = `${s.user}|${s.period}`;
    expMonthPV.set(k, (expMonthPV.get(k) || 0) + s.pv);
    ownLifetimePV.set(s.user, (ownLifetimePV.get(s.user) || 0) + s.pv);
  }
  const storedMonthPV = new Map(monthly.map((m) => [`${m.user}|${m.period}`, m.personalPV || 0]));
  for (const k of new Set([...expMonthPV.keys(), ...storedMonthPV.keys()])) {
    const exp = expMonthPV.get(k) || 0;
    const got = storedMonthPV.get(k) || 0;
    const [uid, p] = k.split('|');
    if (exp !== got) flag(uid, 'FAIL', `${p} personal PV is ${got}, orders/grants add up to ${exp}`);
  }

  // --- Expected lifetime team PV: own PV of everyone whose upline contains the user ---
  const expTeamPV = new Map(users.map((u) => [String(u._id), 0]));
  for (const u of users) {
    const own = ownLifetimePV.get(String(u._id)) || 0;
    if (!own) continue;
    for (const a of u.uplineChain || []) if (expTeamPV.has(String(a))) expTeamPV.set(String(a), expTeamPV.get(String(a)) + own);
  }
  for (const u of users) {
    const exp = expTeamPV.get(String(u._id));
    if ((u.cumulativeTeamPV || 0) !== exp) flag(u._id, 'FAIL', `team PV is ${u.cumulativeTeamPV || 0}, downline purchases add up to ${exp}`);
  }

  // --- Ledger per order / grant: right recipient, right amount, PGPV gate replay ---
  const rowsBySource = new Map();
  for (const t of ledger) {
    const k = t.sourceOrder ? String(t.sourceOrder) : t.sourceManualGrant ? String(t.sourceManualGrant) : null;
    if (!k || !['self_purchase', 'team_level'].includes(t.type)) continue;
    if (!rowsBySource.has(k)) rowsBySource.set(k, []);
    rowsBySource.get(k).push(t);
  }
  const rate = settings.pvToInrRate;
  const runningPV = new Map(); // replay of MonthlyPV.personalPV over time
  // Compressed PGPV in the replay; walls use today's ranks, which is why a gate mismatch
  // under self_plus_team is only a WARN.
  const replayPGPV = (rootId, p) => {
    let total = runningPV.get(`${rootId}|${p}`) || 0;
    const stack = [...(children.get(rootId) || [])];
    while (stack.length) {
      const c = stack.pop();
      total += runningPV.get(`${c._id}|${p}`) || 0;
      if ((c.currentRankSortOrder || 0) < spSort) stack.push(...(children.get(String(c._id)) || []));
    }
    return total;
  };
  const gateExact = !(settings.pgpvThreshold > 0) || settings.pgpvScope !== 'self_plus_team';

  for (const s of sources) {
    const buyer = byId.get(s.user);
    const rows = rowsBySource.get(s.key) || [];
    const what = `${s.kind} ${s.key} (${s.pv} PV)`;
    const k = `${s.user}|${s.period}`;
    runningPV.set(k, (runningPV.get(k) || 0) + s.pv);

    const selfExp = (s.pv * settings.selfPurchasePercent * rate) / 100;
    const self = rows.filter((r) => r.type === 'self_purchase');
    if (selfExp > 0 && self.length !== 1) flag(s.user, 'FAIL', `${what}: ${self.length} self-purchase bonus entries, expected 1`);
    for (const r of self) {
      if (String(r.user) !== s.user) flag(r.user, 'FAIL', `${what}: got the buyer's self-purchase bonus`);
      else if (!near(r.amount, selfExp)) flag(s.user, 'WARN', `${what}: self-purchase bonus Rs ${money(r.amount)}, current settings give Rs ${money(selfExp)}`);
    }

    const chain = (buyer?.uplineChain || []).map(String).slice(0, 10);
    const levels = rows.filter((r) => r.type === 'team_level');
    for (const r of levels) {
      if (!(r.level >= 1 && r.level <= chain.length) || String(r.user) !== chain[r.level - 1]) {
        flag(r.user, 'FAIL', `${what} by ${name(s.user)}: level ${r.level} income Rs ${money(r.amount)} went to someone who is not that level's upline`);
      }
    }
    for (let i = 0; i < chain.length; i++) {
      const pct = settings.teamLevelPercents[i] || 0;
      const got = levels.filter((r) => r.level === i + 1);
      if (got.length > 1) flag(chain[i], 'FAIL', `${what} by ${name(s.user)}: level ${i + 1} income paid ${got.length} times`);
      if (pct <= 0) continue;
      const amount = (s.pv * pct * rate) / 100;
      const pgpv = settings.pgpvScope === 'self_plus_team' ? replayPGPV(chain[i], s.period) : runningPV.get(`${chain[i]}|${s.period}`) || 0;
      const qualified = !(settings.pgpvThreshold > 0) || pgpv >= settings.pgpvThreshold;
      const level = gateExact ? 'FAIL' : 'WARN';
      if (qualified && !got.length) flag(chain[i], level, `${what} by ${name(s.user)}: no level ${i + 1} income, but PGPV ${pgpv} >= gate ${settings.pgpvThreshold} (expected Rs ${money(amount)})`);
      if (!qualified && got.length) flag(chain[i], level, `${what} by ${name(s.user)}: got level ${i + 1} income though PGPV ${pgpv} < gate ${settings.pgpvThreshold}`);
      if (got.length === 1 && !near(got[0].amount, amount)) flag(chain[i], 'WARN', `${what}: level ${i + 1} income Rs ${money(got[0].amount)}, current settings give Rs ${money(amount)}`);
    }
  }

  // --- Wallet: balance = ledger total; payout debits = payout records ---
  const ledgerTotal = new Map();
  const incomeByType = new Map(); // `${user}|${type}` -> amount
  for (const t of ledger) {
    const u = String(t.user);
    ledgerTotal.set(u, (ledgerTotal.get(u) || 0) + t.amount);
    incomeByType.set(`${u}|${t.type}`, (incomeByType.get(`${u}|${t.type}`) || 0) + t.amount);
  }
  const paidOut = new Map();
  for (const p of payouts) paidOut.set(String(p.user), (paidOut.get(String(p.user)) || 0) + p.amount);
  for (const u of users) {
    const id = String(u._id);
    const total = ledgerTotal.get(id) || 0;
    if (!near(u.walletBalance || 0, total)) flag(id, 'FAIL', `wallet Rs ${money(u.walletBalance || 0)} but ledger entries add up to Rs ${money(total)}`);
    const debits = -(incomeByType.get(`${id}|payout_debit`) || 0);
    if (!near(debits, paidOut.get(id) || 0)) flag(id, 'FAIL', `payout debits Rs ${money(debits)} but payout records Rs ${money(paidOut.get(id) || 0)}`);
    if ((u.walletBalance || 0) < -0.01) flag(id, 'FAIL', `wallet is negative (Rs ${money(u.walletBalance)})`);
  }

  // --- Rank: recompute bottom-up from the recomputed PV, deepest users first ---
  const expRank = new Map(); // id -> rank doc | null
  const expSort = (id) => expRank.get(String(id))?.sortOrder || 0;
  const pgpvNow = (rootId) => {
    let total = expMonthPV.get(`${rootId}|${period}`) || 0;
    const stack = [...(children.get(rootId) || [])];
    while (stack.length) {
      const c = stack.pop();
      total += expMonthPV.get(`${c._id}|${period}`) || 0;
      if (expSort(c._id) < spSort) stack.push(...(children.get(String(c._id)) || []));
    }
    return total;
  };
  const subtreeMax = new Map(); // id -> highest expected sortOrder in subtree incl. self
  const byDepth = [...users].sort((a, b) => (b.uplineChain || []).length - (a.uplineChain || []).length);
  for (const u of byDepth) {
    const id = String(u._id);
    let matched = null;
    for (const r of ranks) {
      if (r.ruleType !== 'gpv_threshold') continue;
      if (expTeamPV.get(id) < (r.criteria?.minCumulativeTeamPV || 0)) continue;
      if (r.criteria?.minMonthlyPGPV > 0 && pgpvNow(id) < r.criteria.minMonthlyPGPV) continue;
      matched = r;
      break;
    }
    if (matched && matched.sortOrder >= spSort) {
      for (const r of ranks) {
        if (r.ruleType !== 'count_based') continue;
        const req = rankByName.get(r.countCriteria?.requiredRankName);
        if (!req) continue;
        const legs = (children.get(id) || []).filter((c) => (subtreeMax.get(String(c._id)) || 0) >= req.sortOrder).length;
        if (legs >= (r.countCriteria.requiredCount || 0)) {
          matched = r;
          break;
        }
      }
    }
    expRank.set(id, matched);
    subtreeMax.set(id, Math.max(matched?.sortOrder || 0, ...(children.get(id) || []).map((c) => subtreeMax.get(String(c._id)) || 0)));

    const got = u.currentRank || null;
    const want = matched?.name || null;
    if (got !== want) {
      const why = `team PV ${expTeamPV.get(id)}, this month PGPV ${pgpvNow(id)}`;
      if ((u.currentRankSortOrder || 0) > (matched?.sortOrder || 0)) {
        flag(id, 'WARN', `rank ${got} is higher than the rules give today (${want || 'none'}; ${why}) - held from earlier?`);
      } else flag(id, 'FAIL', `rank is ${got || 'none'}, rules give ${want} (${why})`);
    }
  }

  // --- Report ---
  const customers = users
    .filter((u) => u.role === 'customer')
    .sort((a, b) => (a.uplineChain || []).length - (b.uplineChain || []).length || String(a.referralCode).localeCompare(String(b.referralCode)));
  const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = [
    'Referral code', 'Name', 'Phone', 'Sponsor', 'Level in tree', 'Status',
    `PV ${period} (stored)`, `PV ${period} (expected)`, 'Own lifetime PV',
    'Team PV (stored)', 'Team PV (expected)',
    'Self purchase income', 'Level income', 'Bonus pool', 'Manual adjustments', 'Reversals', 'Paid out',
    'Wallet (stored)', 'Wallet (ledger total)',
    'Rank (stored)', 'Rank (expected)', 'Issues',
  ];
  const lines = [header.map(csvCell).join(',')];
  let ok = 0;
  for (const u of customers) {
    const id = String(u._id);
    const list = issues.get(id);
    const status = list.some((x) => x.startsWith('FAIL')) ? 'FAIL' : list.length ? 'WARN' : 'OK';
    if (status === 'OK') ok++;
    const inc = (type) => money(incomeByType.get(`${id}|${type}`) || 0);
    lines.push(
      [
        u.referralCode, u.name, u.phone, u.sponsor ? name(u.sponsor) : '', (u.uplineChain || []).length, status,
        storedMonthPV.get(`${id}|${period}`) || 0, expMonthPV.get(`${id}|${period}`) || 0, ownLifetimePV.get(id) || 0,
        u.cumulativeTeamPV || 0, expTeamPV.get(id),
        inc('self_purchase'), inc('team_level'), inc('bonus_pool'), inc('manual_adjustment'), inc('reversal'), -inc('payout_debit'),
        money(u.walletBalance || 0), money(ledgerTotal.get(id) || 0),
        u.currentRank || 'none', expRank.get(id)?.name || 'none', list.join(' | '),
      ].map(csvCell).join(',')
    );
  }
  const out = arg('out') || path.join(__dirname, '..', '..', 'audit-reports', `audit-${mongoose.connection.name}-${new Date().toISOString().slice(0, 10)}.csv`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `﻿${lines.join('\r\n')}\r\n`); // BOM so Excel reads UTF-8 names

  console.log(`Settings: PV->Rs ${rate}, self ${settings.selfPurchasePercent}%, levels ${settings.teamLevelPercents.join('/')}%, PGPV gate ${settings.pgpvThreshold} (${settings.pgpvScope})`);
  console.log(`Checked ${customers.length} customers, ${sources.length} credited orders/grants, ${ledger.length} ledger entries\n`);
  for (const u of users) {
    const list = issues.get(String(u._id));
    if (!list.length) continue;
    console.log(`${name(u._id)}`);
    for (const x of list) console.log(`   ${x}`);
  }
  console.log(`\n== ${ok} of ${customers.length} customers OK, ${counts.fail} FAIL, ${counts.warn} WARN ==`);
  console.log(`Report: ${out}`);

  await mongoose.disconnect();
  process.exit(counts.fail ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
