const express = require('express');
const { createOrder, listMyOrders, getMyOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.post('/', createOrder);
router.get('/', listMyOrders);
router.get('/:id', getMyOrder);

module.exports = router;
