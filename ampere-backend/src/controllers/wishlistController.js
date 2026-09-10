const User = require('../models/User');

async function getWishlist(req, res) {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json({ wishlist: user.wishlist });
}

async function addToWishlist(req, res) {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required' });

  const user = await User.findById(req.user._id);
  if (!user.wishlist.some((id) => id.toString() === productId)) {
    user.wishlist.push(productId);
    await user.save();
  }
  await user.populate('wishlist');
  res.status(201).json({ wishlist: user.wishlist });
}

async function removeFromWishlist(req, res) {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  await user.populate('wishlist');
  res.json({ wishlist: user.wishlist });
}

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
