const User = require('../models/User');

async function listAddresses(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ addresses: user.addresses });
}

async function addAddress(req, res) {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ addresses: user.addresses });
}

async function updateAddress(req, res) {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: 'Address not found' });

  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  Object.assign(address, req.body);
  await user.save();
  res.json({ addresses: user.addresses });
}

async function deleteAddress(req, res) {
  const user = await User.findById(req.user._id);
  user.addresses.pull({ _id: req.params.addressId });
  await user.save();
  res.json({ addresses: user.addresses });
}

module.exports = { listAddresses, addAddress, updateAddress, deleteAddress };
