export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  rewardsPoints: number;
  notificationsEnabled: boolean;
}

export interface Category {
  _id: string;
  name: string;
  subtitle?: string;
  image?: string;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  mrp: number;
  pv: number;
  discountPercent: number;
  category: Category | string;
  images: string[];
  stock: number;
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  numReviews: number;
  createdAt: string;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  qty: number;
}

export interface OrderAddress {
  contactName: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id: string;
  user: { _id: string; name: string; email: string; phone?: string };
  items: OrderItem[];
  address: OrderAddress;
  deliverySlot: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'UPI_QR' | 'COD';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  expiryDate?: string;
  active: boolean;
}

export interface PaymentSettings {
  qrImageUrl: string;
  upiId: string;
  payeeName: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  rewardsPoints: number;
  isBlocked: boolean;
  createdAt: string;
  referralCode?: string;
  walletBalance?: number;
  currentRank?: string | null;
  cumulativeTeamPV?: number;
}

export interface DashboardStats {
  ordersCount: number;
  pendingPayments: number;
  usersCount: number;
  lowStockProducts: number;
  revenue: number;
}

// MLM
export interface BonusPool {
  key: 'performance' | 'goldCoin' | 'travel' | 'car' | 'house' | 'profitShare';
  label: string;
  percentOfCompanyPV: number;
  minRankSortOrder: number;
}

export interface MLMSettings {
  pvToInrRate: number;
  selfPurchasePercent: number;
  teamLevelPercents: number[];
  pgpvThreshold: number;
  pgpvScope: 'self' | 'self_plus_directs' | 'self_plus_team';
  bonusPools: BonusPool[];
}

export interface RankDefinition {
  _id: string;
  name: string;
  sortOrder: number;
  criteria: {
    minCumulativeTeamPV: number;
    minDirectReferrals: number;
    minTeamSize: number;
  };
  active: boolean;
}

export interface PoolResult {
  key: string;
  label: string;
  percentOfCompanyPV: number;
  poolAmountInr: number;
  qualifyingUserCount: number;
  perUserAmount: number;
}

export interface MonthlyPayoutRun {
  _id: string;
  period: string;
  totalCompanyPV: number;
  pvRateUsed: number;
  pools: PoolResult[];
  status: 'completed' | 'voided';
  runBy?: { _id: string; name: string };
  voidedAt?: string;
  voidedBy?: { _id: string; name: string };
  createdAt: string;
}

export interface WalletTransaction {
  _id: string;
  user: string;
  type: 'self_purchase' | 'team_level' | 'payout_debit' | 'manual_adjustment';
  amount: number;
  sourceOrder?: string;
  level?: number;
  note?: string;
  createdAt: string;
}

export interface WalletUser {
  _id: string;
  name: string;
  email: string;
  referralCode?: string;
  walletBalance: number;
}

export interface WalletPayout {
  _id: string;
  user: { _id: string; name: string; email: string; referralCode?: string };
  amount: number;
  method?: string;
  reference?: string;
  note?: string;
  paidAt: string;
  createdBy?: { _id: string; name: string };
}

export interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkType: 'none' | 'product' | 'category';
  linkId?: string;
  sortOrder: number;
  active: boolean;
}

export interface DownlineUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  createdAt: string;
  teamSize: number;
  walletBalance: number;
  level: number;
}
