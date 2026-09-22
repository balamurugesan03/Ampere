require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');
const PaymentSettings = require('./models/PaymentSettings');
const MLMSettings = require('./models/MLMSettings');
const RankDefinition = require('./models/RankDefinition');
const Banner = require('./models/Banner');
const User = require('./models/User');

const categorySeeds = [
  { name: 'Medicines', subtitle: 'Care you can trust', sortOrder: 1 },
  { name: 'Ayurveda', subtitle: 'Natural & Safe', sortOrder: 2 },
  { name: 'Personal Care', subtitle: 'Everyday essentials', sortOrder: 3 },
  { name: 'Nutrition', subtitle: 'Fuel your body', sortOrder: 4 },
  { name: 'Diabetes Care', subtitle: 'Manage with confidence', sortOrder: 5 },
  { name: 'Medical Devices', subtitle: 'Monitor at home', sortOrder: 6 },
  { name: 'Heart Care', subtitle: 'Stay heart healthy', sortOrder: 7 },
  { name: 'Bone Health', subtitle: 'Strength for life', sortOrder: 8 },
  { name: 'Baby Care', subtitle: 'Gentle & safe', sortOrder: 9 },
  { name: 'Fitness', subtitle: 'Move more', sortOrder: 10 },
];

const rankSeeds = [
  { name: 'Seeder', sortOrder: 1, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 5000 } },
  { name: 'Planter', sortOrder: 2, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 10000 } },
  { name: 'Performer', sortOrder: 3, ruleType: 'gpv_threshold', criteria: { minCumulativeTeamPV: 25000 } },
  {
    name: 'Star Performer',
    sortOrder: 4,
    ruleType: 'gpv_threshold',
    criteria: { minCumulativeTeamPV: 50000, minMonthlyPGPV: 1000 },
  },
  { name: 'Bronze Star', sortOrder: 5, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 1 } },
  { name: 'Silver Star', sortOrder: 6, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 2 } },
  { name: 'Gold Star', sortOrder: 7, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 3 } },
  { name: 'Platinum', sortOrder: 8, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 4 } },
  { name: 'Star Platinum', sortOrder: 9, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 5 } },
  { name: 'Pearl', sortOrder: 10, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 6 } },
  { name: 'Star Pearl', sortOrder: 11, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 7 } },
  { name: 'Emerald', sortOrder: 12, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 8 } },
  { name: 'Star Emerald', sortOrder: 13, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 9 } },
  { name: 'Ruby', sortOrder: 14, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 10 } },
  { name: 'Star Ruby', sortOrder: 15, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 11 } },
  { name: 'Sapphire', sortOrder: 16, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 12 } },
  { name: 'Star Sapphire', sortOrder: 17, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 13 } },
  // Spec goes 13 -> 15, skipping 14 - implemented literally as given.
  { name: 'Diamond', sortOrder: 18, ruleType: 'count_based', countCriteria: { requiredRankName: 'Star Performer', requiredCount: 15 } },
  { name: 'Star Diamond', sortOrder: 19, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 3 } },
  { name: 'Crown Diamond', sortOrder: 20, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 6 } },
  { name: 'Ambassador', sortOrder: 21, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 9 } },
  { name: 'Crown Ambassador', sortOrder: 22, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 12 } },
  { name: 'Universal Crown Ambassador', sortOrder: 23, ruleType: 'count_based', countCriteria: { requiredRankName: 'Diamond', requiredCount: 15 } },
  {
    name: 'Double Universal Crown Ambassador',
    sortOrder: 24,
    ruleType: 'count_based',
    countCriteria: { requiredRankName: 'Universal Crown Ambassador', requiredCount: 15 },
  },
];

const productSeeds = [
  {
    name: 'Himalaya Ashwagandha Wellness Tablets',
    category: 'Ayurveda',
    subtitle: '60 Tablets',
    description: 'Helps reduce stress, improves stamina and supports overall well-being.',
    price: 299,
    mrp: 375,
    pv: 150,
    stock: 120,
    isFeatured: true,
    isTrending: true,
    rating: 4.6,
    numReviews: 1245,
    images: [
      'https://images.pexels.com/photos/208518/pexels-photo-208518.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/3873174/pexels-photo-3873174.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Accu-Chek Active Strips',
    category: 'Diabetes Care',
    subtitle: '50s',
    description: 'Blood glucose test strips for accurate, everyday monitoring.',
    price: 679,
    mrp: 799,
    pv: 340,
    stock: 80,
    isFeatured: true,
    rating: 4.4,
    numReviews: 512,
    images: [
      'https://images.pexels.com/photos/6941883/pexels-photo-6941883.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/6941884/pexels-photo-6941884.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Ensure Diabetes Care',
    category: 'Nutrition',
    subtitle: '400g Powder',
    description: 'Balanced nutrition drink designed for people managing diabetes.',
    price: 899,
    mrp: 999,
    pv: 450,
    stock: 40,
    isTrending: true,
    rating: 4.5,
    numReviews: 210,
    images: [
      'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Dabur Chwanprash',
    category: 'Ayurveda',
    subtitle: '500g',
    description: 'Traditional Ayurvedic immunity booster made with amla and herbs.',
    price: 240,
    mrp: 280,
    pv: 120,
    stock: 100,
    isTrending: true,
    rating: 4.3,
    numReviews: 890,
    images: [
      'https://images.pexels.com/photos/6543197/pexels-photo-6543197.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/6693657/pexels-photo-6693657.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Volini Pain Relief Gel',
    category: 'Medicines',
    subtitle: '50g',
    description: 'Fast-acting topical gel for muscle and joint pain relief.',
    price: 189,
    mrp: 220,
    pv: 90,
    stock: 150,
    isTrending: true,
    rating: 4.5,
    numReviews: 670,
    images: [
      'https://images.pexels.com/photos/3652097/pexels-photo-3652097.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Revital H',
    category: 'Nutrition',
    subtitle: '30 Capsules',
    description: 'Daily multivitamin for energy, immunity and strength.',
    price: 160,
    mrp: 190,
    pv: 80,
    stock: 90,
    isTrending: true,
    rating: 4.2,
    numReviews: 430,
    images: [
      'https://images.pexels.com/photos/139398/thermometer-headache-pain-pills-139398.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/208512/pexels-photo-208512.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Paracetamol 650mg',
    category: 'Medicines',
    subtitle: 'Strip of 15',
    description: 'For fever and mild to moderate pain relief.',
    price: 30,
    mrp: 35,
    pv: 15,
    stock: 300,
    rating: 4.1,
    numReviews: 95,
    images: [
      'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Vitamin D3 Tablets',
    category: 'Nutrition',
    subtitle: '60 Tablets',
    description: 'Supports bone health and immunity.',
    price: 210,
    mrp: 250,
    pv: 100,
    stock: 140,
    rating: 4.3,
    numReviews: 320,
    images: [
      'https://images.pexels.com/photos/3683041/pexels-photo-3683041.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/3683051/pexels-photo-3683051.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Omega 3 Fish Oil',
    category: 'Nutrition',
    subtitle: '60 Softgels',
    description: 'Supports heart and brain health.',
    price: 450,
    mrp: 550,
    pv: 220,
    stock: 70,
    rating: 4.4,
    numReviews: 180,
    images: [
      'https://images.pexels.com/photos/3683039/pexels-photo-3683039.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Whey Protein Powder',
    category: 'Fitness',
    subtitle: '1kg',
    description: 'High-quality whey protein for muscle recovery and growth.',
    price: 1499,
    mrp: 1799,
    pv: 750,
    stock: 35,
    isFeatured: true,
    rating: 4.5,
    numReviews: 260,
    images: [
      'https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/4162491/pexels-photo-4162491.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Dr Trust Blood Pressure Monitor',
    category: 'Medical Devices',
    subtitle: 'Fully Automatic',
    description: 'Digital BP monitor for accurate home blood pressure checks.',
    price: 1699,
    mrp: 1999,
    pv: 850,
    stock: 45,
    isFeatured: true,
    isTrending: true,
    rating: 4.5,
    numReviews: 340,
    images: [
      'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/4386464/pexels-photo-4386464.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
  {
    name: 'Johnson\'s Baby Lotion',
    category: 'Baby Care',
    subtitle: '200ml',
    description: 'Gentle, mild moisturizing lotion for a baby\'s delicate skin.',
    price: 175,
    mrp: 199,
    pv: 85,
    stock: 200,
    isTrending: true,
    rating: 4.6,
    numReviews: 980,
    images: [
      'https://images.pexels.com/photos/3933250/pexels-photo-3933250.jpeg?cs=srgb&auto=compress&w=600',
      'https://images.pexels.com/photos/3865557/pexels-photo-3865557.jpeg?cs=srgb&auto=compress&w=600',
    ],
  },
];

async function seed() {
  await connectDB();

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    RankDefinition.deleteMany({}),
    Banner.deleteMany({}),
  ]);

  await Banner.insertMany([
    {
      imageUrl: 'https://images.pexels.com/photos/20140029/pexels-photo-20140029.jpeg?cs=srgb&auto=compress&w=400',
      linkType: 'none',
      sortOrder: 1,
      active: true,
    },
  ]);

  // Full 24-tier chart - dev seed is already a hard reset, so just wipe and reinsert.
  await RankDefinition.deleteMany({});
  await RankDefinition.insertMany(rankSeeds);

  const categories = await Category.insertMany(categorySeeds);
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name, c._id]));

  await Product.insertMany(
    productSeeds.map((p) => ({ ...p, category: categoryByName[p.category] }))
  );

  await Coupon.insertMany([
    { code: 'WELCOME10', discountType: 'percent', discountValue: 10, minOrderValue: 300, active: true },
    { code: 'FLAT50', discountType: 'flat', discountValue: 50, minOrderValue: 500, active: true },
  ]);

  const settings = await PaymentSettings.getSingleton();
  settings.upiId = settings.upiId || 'ampere@upi';
  settings.payeeName = settings.payeeName || 'Ampere Health Store';
  await settings.save();

  await MLMSettings.getSingleton();

  const adminEmail = (process.env.ADMIN_SEED_EMAIL || 'admin@ampere.com').toLowerCase();
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD || 'Admin@12345', 10);
  await User.findOneAndUpdate(
    { email: adminEmail },
    { name: 'Ampere Admin', email: adminEmail, passwordHash: adminPasswordHash, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Root distributor: bootstraps the mandatory-sponsor MLM tree (sponsor: null is only valid here).
  const rootPasswordHash = await bcrypt.hash('RootPass@123', 10);
  const root = await User.findOneAndUpdate(
    { email: 'root@ampere.internal' },
    {
      name: 'Ampere Root',
      email: 'root@ampere.internal',
      passwordHash: rootPasswordHash,
      role: 'customer',
      referralCode: 'AMPEREROOT',
      sponsor: null,
      uplineChain: [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const demoPasswordHash = await bcrypt.hash('Test@1234', 10);
  await User.findOneAndUpdate(
    { email: 'rajesh@example.com' },
    {
      name: 'Rajesh Puzhakkal',
      email: 'rajesh@example.com',
      passwordHash: demoPasswordHash,
      phone: '+91 96338 86333',
      role: 'customer',
      rewardsPoints: 120,
      referralCode: 'RAJESH01',
      sponsor: root._id,
      uplineChain: [root._id],
      addresses: [
        {
          label: 'Home',
          contactName: 'Rajesh Puzhakkal',
          phone: '+91 96338 86333',
          line: 'Aikkara Towers, Ullyakovil Rd, near Nairs Hospital, Asramam',
          city: 'Kollam',
          state: 'Kerala',
          pincode: '691002',
          isDefault: true,
        },
      ],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.updateOne({ _id: root._id }, { $set: { directReferralsCount: 1, teamSize: 1 } });

  console.log(`Seeded ${categories.length} categories, ${productSeeds.length} products, 2 coupons.`);
  console.log(`Admin login: ${adminEmail} / ${process.env.ADMIN_SEED_PASSWORD || 'Admin@12345'}`);
  console.log('Demo customer login: rajesh@example.com / Test@1234 (referral code: RAJESH01)');
  console.log('Root distributor login: root@ampere.internal / RootPass@123 (referral code: AMPEREROOT)');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
