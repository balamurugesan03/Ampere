const Category = require('../models/Category');

async function listCategories(req, res) {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ categories });
}

async function createCategory(req, res) {
  const category = await Category.create(req.body);
  res.status(201).json({ category });
}

async function updateCategory(req, res) {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ category });
}

async function deleteCategory(req, res) {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found' });
  res.json({ message: 'Category deleted' });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
