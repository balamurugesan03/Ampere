const express = require('express');
const { myDownline } = require('../controllers/networkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/my-downline', protect, myDownline);

module.exports = router;
