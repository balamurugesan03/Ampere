const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    linkType: { type: String, enum: ['none', 'product', 'category'], default: 'none' },
    linkId: { type: mongoose.Schema.Types.ObjectId },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);
