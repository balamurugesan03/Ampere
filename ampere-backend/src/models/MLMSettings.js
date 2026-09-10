const mongoose = require('mongoose');

const mlmSettingsSchema = new mongoose.Schema(
  {
    pvToInrRate: { type: Number, default: 1 },
    selfPurchasePercent: { type: Number, default: 20 },
    teamLevelPercents: {
      type: [Number],
      default: [10, 8, 6, 4, 2, 1, 1, 1, 1, 1],
    },
    pgpvThreshold: { type: Number, default: 0 },
    pgpvScope: {
      type: String,
      enum: ['self', 'self_plus_directs', 'self_plus_team'],
      default: 'self',
    },
    bonusPools: {
      type: [
        {
          key: {
            type: String,
            enum: ['performance', 'goldCoin', 'travel', 'car', 'house', 'profitShare'],
            required: true,
          },
          label: { type: String, required: true },
          percentOfCompanyPV: { type: Number, default: 0 },
          minRankSortOrder: { type: Number, default: 1 },
        },
      ],
      default: [
        { key: 'performance', label: 'Performance Bonus', percentOfCompanyPV: 2, minRankSortOrder: 1 },
        { key: 'goldCoin', label: 'Gold Coin Fund', percentOfCompanyPV: 2, minRankSortOrder: 1 },
        { key: 'travel', label: 'Travel Fund', percentOfCompanyPV: 2, minRankSortOrder: 2 },
        { key: 'car', label: 'Car Fund', percentOfCompanyPV: 3, minRankSortOrder: 3 },
        { key: 'house', label: 'House Fund', percentOfCompanyPV: 3, minRankSortOrder: 4 },
        { key: 'profitShare', label: 'Profit Share', percentOfCompanyPV: 2, minRankSortOrder: 5 },
      ],
    },
  },
  { timestamps: true }
);

mlmSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('MLMSettings', mlmSettingsSchema);
