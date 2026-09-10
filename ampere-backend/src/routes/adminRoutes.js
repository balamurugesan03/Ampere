const express = require('express');
const { getDashboardStats, listUsers, updateUser, uploadFile } = require('../controllers/adminController');
const { listAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { userDownline } = require('../controllers/networkController');
const { userWallet, userTransactions } = require('../controllers/walletController');
const {
  listWalletBalances,
  payUser,
  payoutHistory,
  runMonthlyPayoutHandler,
  monthlyPayoutRunHistory,
  voidMonthlyPayoutRun,
} = require('../controllers/payoutController');
const { createRank, updateRank, deleteRank } = require('../controllers/rankController');
const {
  listAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require('../controllers/bannerController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.get('/orders', listAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/users', listUsers);
router.put('/users/:id', updateUser);
router.post('/upload', upload.single('file'), uploadFile);

router.get('/network/:userId/downline', userDownline);
router.get('/wallet/:userId', userWallet);
router.get('/wallet/:userId/transactions', userTransactions);
router.get('/payouts/wallets', listWalletBalances);
router.post('/payouts/:userId/pay', payUser);
router.get('/payouts/history', payoutHistory);
router.post('/payouts/monthly-run', runMonthlyPayoutHandler);
router.get('/payouts/monthly-run/history', monthlyPayoutRunHistory);
router.post('/payouts/monthly-run/:id/void', voidMonthlyPayoutRun);

router.post('/mlm/ranks', createRank);
router.put('/mlm/ranks/:id', updateRank);
router.delete('/mlm/ranks/:id', deleteRank);

router.get('/banners', listAllBanners);
router.post('/banners', createBanner);
router.put('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

module.exports = router;
