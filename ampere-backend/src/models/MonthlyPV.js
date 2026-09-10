const mongoose = require('mongoose');

const monthlyPVSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true }, // 'YYYY-MM'
    personalPV: { type: Number, default: 0 },
    teamPV: { type: Number, default: 0 },
  },
  { timestamps: true }
);

monthlyPVSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyPV', monthlyPVSchema);
