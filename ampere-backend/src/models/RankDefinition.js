const mongoose = require('mongoose');

// Two rule kinds share one document shape:
// - 'gpv_threshold' (Seeder..Star Performer): matched against cumulativeTeamPV (lifetime,
//   uncompressed) and, for Star Performer only, the current month's compressed PGPV.
// - 'count_based' (Bronze Star..Double UCA): matched by counting downline members who
//   themselves hold `countCriteria.requiredRankName` or higher, anywhere in the downline.
const rankDefinitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, required: true, unique: true },
    ruleType: { type: String, enum: ['gpv_threshold', 'count_based'], required: true },
    criteria: {
      minCumulativeTeamPV: { type: Number, default: 0 },
      minMonthlyPGPV: { type: Number, default: 0 }, // compressed personal-group PV, current period
    },
    countCriteria: {
      requiredRankName: { type: String, default: null },
      requiredCount: { type: Number, default: 0 },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RankDefinition', rankDefinitionSchema);
