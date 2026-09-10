const express = require('express');
const { listActiveBanners } = require('../controllers/bannerController');

const router = express.Router();

router.get('/', listActiveBanners);

module.exports = router;
