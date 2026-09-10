const RankDefinition = require('../models/RankDefinition');

async function listRanks(req, res) {
  const ranks = await RankDefinition.find().sort({ sortOrder: 1 });
  res.json({ ranks });
}

async function createRank(req, res) {
  const rank = await RankDefinition.create(req.body);
  res.status(201).json({ rank });
}

async function updateRank(req, res) {
  const rank = await RankDefinition.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!rank) return res.status(404).json({ message: 'Rank not found' });
  res.json({ rank });
}

async function deleteRank(req, res) {
  const rank = await RankDefinition.findByIdAndDelete(req.params.id);
  if (!rank) return res.status(404).json({ message: 'Rank not found' });
  res.json({ message: 'Rank deleted' });
}

module.exports = { listRanks, createRank, updateRank, deleteRank };
