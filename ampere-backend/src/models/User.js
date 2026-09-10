const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    contactName: { type: String, required: true },
    phone: { type: String, required: true },
    line: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    rewardsPoints: { type: Number, default: 0 },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [cartItemSchema],
    addresses: [addressSchema],
    notificationsEnabled: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false },

    // MLM
    referralCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    sponsor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    uplineChain: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    directReferralsCount: { type: Number, default: 0 },
    teamSize: { type: Number, default: 0 },
    cumulativeTeamPV: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    currentRank: { type: String, default: null },
    currentRankSortOrder: { type: Number, default: 0 },
    rankAchievedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ uplineChain: 1 });

module.exports = mongoose.model('User', userSchema);
