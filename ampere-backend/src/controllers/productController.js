const Product = require('../models/Product');

async function listProducts(req, res) {
  const { category, search, featured, trending } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (featured === 'true') filter.isFeatured = true;
  if (trending === 'true') filter.isTrending = true;
  if (search) filter.$text = { $search: search };

  const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
  res.json({ products });
}

async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('category', 'name');
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
}

async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
}

async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ product });
}

async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product deleted' });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
