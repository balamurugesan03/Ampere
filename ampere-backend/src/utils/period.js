// Shared 'YYYY-MM' period key used across MonthlyPV, CommissionTransaction and
// MonthlyPayoutRun. Pulled out of commissionService.js so rankService/pgpvService/
// manualGrantService can all use it without a circular require.
function periodOf(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

module.exports = { periodOf };
