const ExcelJS = require('exceljs');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const CommissionTransaction = require('../models/CommissionTransaction');
const WalletPayout = require('../models/WalletPayout');
const MonthlyPayoutRun = require('../models/MonthlyPayoutRun');
const MonthlyPV = require('../models/MonthlyPV');
const ManualPVGrant = require('../models/ManualPVGrant');
const RankDefinition = require('../models/RankDefinition');
const MLMSettings = require('../models/MLMSettings');
const PaymentSettings = require('../models/PaymentSettings');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');

// Every module that can be backed up. Each becomes one sheet in the Excel file.
const MODULES = [
  { key: 'users', label: 'Users', model: User, omit: ['passwordHash'] },
  { key: 'orders', label: 'Orders', model: Order },
  { key: 'products', label: 'Products', model: Product },
  { key: 'categories', label: 'Categories', model: Category },
  { key: 'banners', label: 'Banners', model: Banner },
  { key: 'coupons', label: 'Coupons', model: Coupon },
  { key: 'commissions', label: 'Commission Transactions', model: CommissionTransaction },
  { key: 'walletPayouts', label: 'Wallet Payouts', model: WalletPayout },
  { key: 'monthlyPayoutRuns', label: 'Monthly Payout Runs', model: MonthlyPayoutRun },
  { key: 'monthlyPV', label: 'Monthly PV', model: MonthlyPV },
  { key: 'pvGrants', label: 'Manual PV Grants', model: ManualPVGrant },
  { key: 'ranks', label: 'Rank Definitions', model: RankDefinition },
  { key: 'mlmSettings', label: 'MLM Settings', model: MLMSettings },
  { key: 'paymentSettings', label: 'Payment Settings', model: PaymentSettings },
  { key: 'notifications', label: 'Notifications', model: Notification },
  { key: 'counters', label: 'Counters', model: Counter },
];

const MAX_CELL = 32000; // Excel's hard limit is 32767 chars per cell

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
    && !v._bsontype && !Buffer.isBuffer(v);
}

// Nested objects become dotted columns (address.city); arrays are stored as JSON text
// so nothing is lost and the sheet stays one row per document.
function flatten(doc, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(doc)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isPlainObject(v) && Object.keys(v).length) flatten(v, key, out);
    else out[key] = toCell(v);
  }
  return out;
}

function toCell(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v;
  if (v._bsontype) return v.toString(); // ObjectId, Decimal128, ...
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.length > MAX_CELL ? v.slice(0, MAX_CELL) : v;
  const json = JSON.stringify(v);
  return json.length > MAX_CELL ? json.slice(0, MAX_CELL) : json;
}

async function listBackupModules(req, res) {
  const counts = await Promise.all(MODULES.map((m) => m.model.estimatedDocumentCount()));
  res.json({
    modules: MODULES.map((m, i) => ({ key: m.key, label: m.label, count: counts[i] })),
  });
}

// GET /admin/backup/export?modules=users,orders  (omit modules = everything)
async function exportBackup(req, res) {
  const requested = String(req.query.modules || '').split(',').map((s) => s.trim()).filter(Boolean);
  const selected = requested.length ? MODULES.filter((m) => requested.includes(m.key)) : MODULES;
  if (!selected.length) return res.status(400).json({ message: 'No valid modules selected' });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ampere Admin';
  workbook.created = new Date();

  const counts = [];

  for (const m of selected) {
    const docs = await m.model.find().sort({ createdAt: 1, _id: 1 }).lean();
    const rows = docs.map((d) => {
      for (const f of m.omit || []) delete d[f];
      return flatten(d);
    });

    // Union of all keys, _id first, timestamps last
    const keys = new Set(['_id']);
    rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    const tail = ['createdAt', 'updatedAt', '__v'].filter((k) => keys.delete(k));
    const columns = [...keys, ...tail];

    const sheet = workbook.addWorksheet(m.label.slice(0, 31));
    sheet.columns = columns.map((k) => ({ header: k, key: k, width: Math.min(Math.max(k.length + 2, 14), 40) }));
    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    rows.forEach((r) => sheet.addRow(r));
    columns.forEach((k, i) => {
      if (rows.some((r) => r[k] instanceof Date)) sheet.getColumn(i + 1).numFmt = 'yyyy-mm-dd hh:mm:ss';
    });

    counts.push({ sheet: sheet.name, records: rows.length });
  }

  // Data sheets come first so the file opens on real records; the summary sits at the
  // end with links to each sheet. A single-module export needs no summary.
  if (selected.length > 1) {
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Module', key: 'module', width: 28 },
      { header: 'Records', key: 'records', width: 12 },
    ];
    summary.getRow(1).font = { bold: true };
    for (const c of counts) {
      summary.addRow({ module: { text: c.sheet, hyperlink: `#'${c.sheet}'!A1` }, records: c.records });
    }
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="ampere-backup-${stamp}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { listBackupModules, exportBackup };
