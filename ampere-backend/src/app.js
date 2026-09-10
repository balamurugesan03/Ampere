const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentSettingsRoutes = require('./routes/paymentSettingsRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mlmSettingsRoutes = require('./routes/mlmSettingsRoutes');
const networkRoutes = require('./routes/networkRoutes');
const walletRoutes = require('./routes/walletRoutes');
const rankRoutes = require('./routes/rankRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-settings', paymentSettingsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/mlm-settings', mlmSettingsRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/mlm/ranks', rankRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
