const MLMSettings = require('../models/MLMSettings');

async function getMLMSettings(req, res) {
  const settings = await MLMSettings.getSingleton();
  res.json({ mlmSettings: settings });
}

async function updateMLMSettings(req, res) {
  const settings = await MLMSettings.getSingleton();
  const { pvToInrRate, selfPurchasePercent, teamLevelPercents, pgpvThreshold, pgpvScope, bonusPools } = req.body;

  if (pvToInrRate !== undefined) settings.pvToInrRate = pvToInrRate;
  if (selfPurchasePercent !== undefined) settings.selfPurchasePercent = selfPurchasePercent;
  if (Array.isArray(teamLevelPercents)) settings.teamLevelPercents = teamLevelPercents;
  if (pgpvThreshold !== undefined) settings.pgpvThreshold = pgpvThreshold;
  if (pgpvScope !== undefined) settings.pgpvScope = pgpvScope;
  if (Array.isArray(bonusPools)) settings.bonusPools = bonusPools;

  await settings.save();
  res.json({ mlmSettings: settings });
}

module.exports = { getMLMSettings, updateMLMSettings };
