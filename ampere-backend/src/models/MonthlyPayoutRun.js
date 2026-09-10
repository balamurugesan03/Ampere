const mongoose = require('mongoose');

const poolResultSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    percentOfCompanyPV: Number,
    poolAmountInr: Number,
    qualifyingUserCount: Number,
    perUserAmount: Number,
  },
  { _id: false }
);

const monthlyPayoutRunSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, unique: true }, // 'YYYY-MM'
    totalCompanyPV: { type: Number, required: true },
    pvRateUsed: { type: Number, required: true },
    pools: [poolResultSchema],
    status: { type: String, enum: ['completed', 'voided'], default: 'completed' },
    runBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MonthlyPayoutRun', monthlyPayoutRunSchema);
