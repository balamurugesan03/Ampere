const PaymentSettings = require('../models/PaymentSettings');

async function getPaymentSettings(req, res) {
  const settings = await PaymentSettings.getSingleton();
  res.json({ paymentSettings: settings });
}

async function updatePaymentSettings(req, res) {
  const settings = await PaymentSettings.getSingleton();
  const { upiId, payeeName } = req.body;
  if (upiId !== undefined) settings.upiId = upiId;
  if (payeeName !== undefined) settings.payeeName = payeeName;
  if (req.file) settings.qrImageUrl = `/uploads/${req.file.filename}`;
  await settings.save();
  res.json({ paymentSettings: settings });
}

module.exports = { getPaymentSettings, updatePaymentSettings };
