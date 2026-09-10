const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { creditOrderCommissions } = require('../services/commissionService');

const DELIVERY_CHARGE = 40;
const FREE_DELIVERY_THRESHOLD = 1000;

async function createOrder(req, res) {
  const { addressId, deliverySlot, paymentMethod } = req.body;
  if (!addressId || !paymentMethod) {
    return res.status(400).json({ message: 'addressId and paymentMethod are required' });
  }

  const user = await User.findById(req.user._id).populate('cart.product');
  if (!user.cart.length) return res.status(400).json({ message: 'Cart is empty' });

  const address = user.addresses.id(addressId);
  if (!address) return res.status(404).json({ message: 'Address not found' });

  const items = user.cart.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.product.price,
    pv: item.product.pv,
    qty: item.quantity,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const total = subtotal + deliveryCharge;

  const order = await Order.create({
    user: user._id,
    items,
    address: {
      contactName: address.contactName,
      phone: address.phone,
      line: address.line,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    deliverySlot,
    subtotal,
    deliveryCharge,
    total,
    paymentMethod,
  });

  user.cart = [];
  await user.save();

  res.status(201).json({ order });
}

async function listMyOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
}

async function getMyOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json({ order });
}

async function listAllOrders(req, res) {
  const { orderStatus, paymentStatus } = req.query;
  const filter = {};
  if (orderStatus) filter.orderStatus = orderStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const orders = await Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 });
  res.json({ orders });
}

async function updateOrderStatus(req, res) {
  const { orderStatus, paymentStatus } = req.body;
  let order;
  let justPaid = false;

  if (paymentStatus === 'paid') {
    // Atomic pending->paid transition guard: two concurrent "mark as paid" clicks can't both win,
    // which keeps commission crediting below from running twice for the same order.
    const update = { paymentStatus: 'paid', paidAt: new Date() };
    if (orderStatus) update.orderStatus = orderStatus;

    order = await Order.findOneAndUpdate(
      { _id: req.params.id, paymentStatus: { $ne: 'paid' } },
      update,
      { new: true, runValidators: true }
    );

    if (order) {
      justPaid = true;
    } else {
      // Already paid - apply any other field changes without re-triggering crediting.
      order = await Order.findById(req.params.id);
      if (order && orderStatus) {
        order.orderStatus = orderStatus;
        await order.save();
      }
    }
  } else {
    const update = {};
    if (orderStatus) update.orderStatus = orderStatus;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    order = await Order.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  }

  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (justPaid && !order.commissionsCredited) {
    try {
      await creditOrderCommissions(order);
      order.commissionsCredited = true;
      await order.save();
    } catch (err) {
      console.error('Commission crediting failed for order', order._id, err);
    }
  }

  res.json({ order });
}

module.exports = { createOrder, listMyOrders, getMyOrder, listAllOrders, updateOrderStatus };
