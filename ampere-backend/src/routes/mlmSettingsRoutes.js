const express = require('express');
const { getMLMSettings, updateMLMSettings } = require('../controllers/mlmSettingsController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', protect, getMLMSettings);
router.put('/', protect, requireRole('admin'), updateMLMSettings);

module.exports = router;
