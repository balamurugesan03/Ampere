require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');

// One-off admin access fixer. Safe to re-run.
//   node src/resetAdminPassword.js <email> <newPassword>
// or set ADMIN_FIX_EMAIL / ADMIN_FIX_PASSWORD in the environment.
//
// - Lists every admin user it can see (so you can confirm which DB you hit).
// - If <email> exists: sets role=admin, clears isBlocked, resets the password.
// - If it does not exist: creates it as an admin.

async function main() {
  const email = (process.argv[2] || process.env.ADMIN_FIX_EMAIL || '').toLowerCase().trim();
  const password = process.argv[3] || process.env.ADMIN_FIX_PASSWORD || '';

  await connectDB();

  const admins = await User.find({ role: 'admin' }).select('email name isBlocked').lean();
  console.log(`\nExisting admin users (${admins.length}):`);
  admins.forEach((a) => console.log(`  - ${a.email}${a.isBlocked ? '  [BLOCKED]' : ''}`));

  if (!email || !password) {
    console.log('\nNo email/password given, nothing changed.');
    console.log('Run: node src/resetAdminPassword.js <email> <newPassword>');
    process.exit(0);
  }

  if (password.length < 10) {
    console.error('\nRefusing: password must be at least 10 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.isBlocked = false;
    await existing.save();
    console.log(`\nUpdated ${email}: password reset, role=admin, unblocked.`);
  } else {
    await User.create({ email, name: 'Ampere Admin', passwordHash, role: 'admin' });
    console.log(`\nCreated ${email} as an admin.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed', err);
  process.exit(1);
});
