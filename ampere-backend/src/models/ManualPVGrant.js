const mongoose = require('mongoose');

// An admin-issued PV grant, e.g. to reconcile PV owed from an offline transaction. Flows
// through the exact same crediting pipeline as a real paid order (see manualGrantService),
// so it produces ordinary self_purchase/team_level ledger rows tagged with sourceManualGrant.
const manualPVGrantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pv: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    revokedAt: { type: Date },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

manualPVGrantSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ManualPVGrant', manualPVGrantSchema);
