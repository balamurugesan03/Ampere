const mongoose = require('mongoose');

const paymentSettingsSchema = new mongoose.Schema(
  {
    qrImageUrl: { type: String, default: '' },
    upiId: { type: String, default: '' },
    payeeName: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) doc = await this.create({});
  return doc;
};

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
