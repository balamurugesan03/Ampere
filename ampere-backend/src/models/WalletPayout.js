const mongoose = require('mongoose');

const walletPayoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: '' },
    reference: { type: String, default: '' },
    note: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

walletPayoutSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletPayout', walletPayoutSchema);
