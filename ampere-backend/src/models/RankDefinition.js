const mongoose = require('mongoose');

const rankDefinitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, required: true, unique: true },
    criteria: {
      minCumulativeTeamPV: { type: Number, default: 0 },
      minDirectReferrals: { type: Number, default: 0 },
      minTeamSize: { type: Number, default: 0 },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RankDefinition', rankDefinitionSchema);
