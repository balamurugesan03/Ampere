const express = require('express');
const { listRanks } = require('../controllers/rankController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listRanks);

module.exports = router;
