const mongoose = require('mongoose');

const commissionTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['self_purchase', 'team_level', 'bonus_pool', 'payout_debit', 'manual_adjustment', 'reversal'],
      required: true,
    },
    amount: { type: Number, required: true },
    sourceType: { type: String, enum: ['order', 'manual_grant'], default: 'order' },
    sourceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    sourceManualGrant: { type: mongoose.Schema.Types.ObjectId, ref: 'ManualPVGrant' },
    level: { type: Number },
    period: { type: String }, // 'YYYY-MM', bonus_pool entries
    payoutRun: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyPayoutRun' },
    poolKey: { type: String }, // which bonus pool, bonus_pool entries only - a run credits several pools per user
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

commissionTransactionSchema.index({ user: 1, createdAt: -1 });
commissionTransactionSchema.index(
  { sourceOrder: 1, user: 1, type: 1, level: 1 },
  { unique: true, partialFilterExpression: { sourceOrder: { $type: 'objectId' } } }
);
commissionTransactionSchema.index(
  { sourceManualGrant: 1, user: 1, type: 1, level: 1 },
  { unique: true, partialFilterExpression: { sourceManualGrant: { $type: 'objectId' } } }
);
commissionTransactionSchema.index(
  { user: 1, payoutRun: 1, poolKey: 1 },
  { unique: true, partialFilterExpression: { type: 'bonus_pool' } }
);

module.exports = mongoose.model('CommissionTransaction', commissionTransactionSchema);
