export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  rewardsPoints: number;
  notificationsEnabled: boolean;
  referralCode?: string;
  walletBalance?: number;
  currentRank?: string | null;
  currentRankSortOrder?: number;
  cumulativeTeamPV?: number;
  directReferralsCount?: number;
  teamSize?: number;
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
  discountPercent: number;
  category: Category | string;
  images: string[];
  stock: number;
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  numReviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  _id: string;
  label: string;
  contactName: string;
  phone: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  address: Omit<Address, '_id' | 'label' | 'isDefault'>;
  deliverySlot: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'UPI_QR' | 'COD';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface PaymentSettings {
  qrImageUrl: string;
  upiId: string;
  payeeName: string;
}

export interface WalletTransaction {
  _id: string;
  type: 'self_purchase' | 'team_level' | 'payout_debit' | 'manual_adjustment';
  amount: number;
  level?: number;
  note?: string;
  createdAt: string;
}

export interface DownlineUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  createdAt: string;
  teamSize: number;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkType: 'none' | 'product' | 'category';
  linkId?: string;
  sortOrder: number;
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
