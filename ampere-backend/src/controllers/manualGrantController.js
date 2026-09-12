const { grantPV, listGrantsForUser, revokePV } = require('../services/manualGrantService');

async function createGrant(req, res) {
  try {
    const { userId, pv, reason } = req.body;
    const grant = await grantPV(userId, Number(pv), reason, req.user._id);
    res.status(201).json({ grant });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function listGrants(req, res) {
  const grants = await listGrantsForUser(req.params.userId);
  res.json({ grants });
}

async function revokeGrant(req, res) {
  try {
    const grant = await revokePV(req.params.id, req.user._id);
    res.json({ grant });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = { createGrant, listGrants, revokeGrant };
