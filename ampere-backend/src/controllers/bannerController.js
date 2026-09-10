const Banner = require('../models/Banner');

async function listActiveBanners(req, res) {
  const banners = await Banner.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ banners });
}

async function listAllBanners(req, res) {
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ banners });
}

async function createBanner(req, res) {
  const banner = await Banner.create(req.body);
  res.status(201).json({ banner });
}

async function updateBanner(req, res) {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json({ banner });
}

async function deleteBanner(req, res) {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json({ message: 'Banner deleted' });
}

module.exports = { listActiveBanners, listAllBanners, createBanner, updateBanner, deleteBanner };
