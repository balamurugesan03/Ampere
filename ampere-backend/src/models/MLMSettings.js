const mongoose = require('mongoose');

const mlmSettingsSchema = new mongoose.Schema(
  {
    pvToInrRate: { type: Number, default: 1 },
    selfPurchasePercent: { type: Number, default: 10 }, // Self Purchase Bonus
    teamLevelPercents: {
      type: [Number],
      default: [10, 8, 6, 4, 2, 1, 1, 1, 1, 1], // Development Bonus, 10 levels, sums to 35%
    },
    pgpvThreshold: { type: Number, default: 1000 },
    pgpvScope: {
      type: String,
      enum: ['self', 'self_plus_directs', 'self_plus_team'],
      default: 'self_plus_team', // compressed personal-group PV, see pgpvService
    },
    bonusPools: {
      type: [
        {
          key: { type: String, required: true }, // free-form, admin-editable, not an enum
          label: { type: String, required: true },
          percentOfCompanyPV: { type: Number, default: 0 },
          minRankSortOrder: { type: Number, default: 1 },
        },
      ],
      // The 12 Company-PV-based incomes (items 4-15 of the plan). minRankSortOrder is a
      // proposed default progression, not specified by the source plan - admin can retune
      // freely here without any code change.
      default: [
        { key: 'performance', label: 'Performance Bonus', percentOfCompanyPV: 1, minRankSortOrder: 4 }, // Star Performer
        { key: 'android', label: 'Android Fund', percentOfCompanyPV: 1, minRankSortOrder: 4 },
        { key: 'silverCoin', label: 'Silver Coin Fund', percentOfCompanyPV: 1, minRankSortOrder: 4 },
        { key: 'goldCoin', label: 'Gold Coin Fund', percentOfCompanyPV: 2, minRankSortOrder: 5 }, // Bronze Star
        { key: 'travel', label: 'Travel Fund', percentOfCompanyPV: 2, minRankSortOrder: 5 },
        { key: 'twoWheeler', label: 'Two Wheeler Fund', percentOfCompanyPV: 3, minRankSortOrder: 6 }, // Silver Star
        { key: 'car', label: 'Car Fund', percentOfCompanyPV: 3, minRankSortOrder: 7 }, // Gold Star
        { key: 'house', label: 'House Fund', percentOfCompanyPV: 3, minRankSortOrder: 8 }, // Platinum
        { key: 'profitShare', label: 'Profit Share Bonus', percentOfCompanyPV: 2, minRankSortOrder: 10 }, // Pearl
        { key: 'lor', label: 'Leadership Over Riding Bonus', percentOfCompanyPV: 4, minRankSortOrder: 14 }, // Ruby
        { key: 'uca', label: 'UCA Bonus', percentOfCompanyPV: 1, minRankSortOrder: 18 }, // Diamond
        { key: 'royalty', label: 'Royalty Bonus', percentOfCompanyPV: 2, minRankSortOrder: 23 }, // Universal Crown Ambassador
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
