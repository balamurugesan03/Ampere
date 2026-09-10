const express = require('express');
const { myWallet, myTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, myWallet);
router.get('/me/transactions', protect, myTransactions);

module.exports = router;
