const User = require('../models/User');

async function getCart(req, res) {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json({ cart: user.cart });
}

async function addToCart(req, res) {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: 'productId is required' });

  const user = await User.findById(req.user._id);
  const existing = user.cart.find((item) => item.product.toString() === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    user.cart.push({ product: productId, quantity });
  }
  await user.save();
  await user.populate('cart.product');
  res.status(201).json({ cart: user.cart });
}

async function updateCartItem(req, res) {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ message: 'quantity must be >= 1' });

  const user = await User.findById(req.user._id);
  const item = user.cart.find((i) => i.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ message: 'Item not in cart' });

  item.quantity = quantity;
  await user.save();
  await user.populate('cart.product');
  res.json({ cart: user.cart });
}

async function removeCartItem(req, res) {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter((i) => i.product.toString() !== req.params.productId);
  await user.save();
  await user.populate('cart.product');
  res.json({ cart: user.cart });
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
