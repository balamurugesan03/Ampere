const express = require('express');
const { myDownline, myRankProgress } = require('../controllers/networkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my-downline', protect, myDownline);
router.get('/my-rank-progress', protect, myRankProgress);

module.exports = router;
