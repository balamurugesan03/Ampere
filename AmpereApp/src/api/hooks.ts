import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Address,
  Banner,
  CartItem,
  Category,
  DownlineUser,
  Order,
  PaymentSettings,
  Product,
  RankDefinition,
  WalletTransaction,
} from './types';

// Banners
export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get<{ banners: Banner[] }>('/banners')).data.banners,
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ categories: Category[] }>('/categories')).data.categories,
  });
}

// Products
interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
  trending?: boolean;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () =>
      (await api.get<{ products: Product[] }>('/products', { params: filters })).data.products,
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get<{ product: Product }>(`/products/${id}`)).data.product,
    enabled: !!id,
  });
}

// Cart
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get<{ cart: CartItem[] }>('/cart')).data.cart,
    // A product deleted after being carted comes back as null; rendering it would crash.
    select: (cart) => cart.filter((item) => item.product),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) =>
      (await api.post<{ cart: CartItem[] }>('/cart', { productId, quantity })).data.cart,
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) =>
      (await api.put<{ cart: CartItem[] }>(`/cart/${productId}`, { quantity })).data.cart,
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      (await api.delete<{ cart: CartItem[] }>(`/cart/${productId}`)).data.cart,
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  });
}

// Wishlist
export function useWishlist() {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get<{ wishlist: Product[] }>('/wishlist')).data.wishlist,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      (await api.post<{ wishlist: Product[] }>('/wishlist', { productId })).data.wishlist,
    onSuccess: (wishlist) => queryClient.setQueryData(['wishlist'], wishlist),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) =>
      (await api.delete<{ wishlist: Product[] }>(`/wishlist/${productId}`)).data.wishlist,
    onSuccess: (wishlist) => queryClient.setQueryData(['wishlist'], wishlist),
  });
}

// Addresses
export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get<{ addresses: Address[] }>('/addresses')).data.addresses,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (address: Omit<Address, '_id'>) =>
      (await api.post<{ addresses: Address[] }>('/addresses', address)).data.addresses,
    onSuccess: (addresses) => queryClient.setQueryData(['addresses'], addresses),
  });
}

// Orders
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get<{ orders: Order[] }>('/orders')).data.orders,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { addressId: string; deliverySlot: string; paymentMethod: 'UPI_QR' | 'COD' }) =>
      (await api.post<{ order: Order }>('/orders', payload)).data.order,
    onSuccess: () => {
      queryClient.setQueryData(['cart'], []);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Payment settings
export function usePaymentSettings() {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () =>
      (await api.get<{ paymentSettings: PaymentSettings }>('/payment-settings')).data.paymentSettings,
  });
}

// Referral / network
export function useValidateReferralCode(code: string) {
  return useQuery({
    queryKey: ['referral-validate', code],
    queryFn: async () =>
      (await api.get<{ valid: boolean; sponsorName?: string; message?: string }>(
        `/auth/referral/${code}/validate`
      )).data,
    enabled: code.trim().length >= 4,
    retry: false,
  });
}

export function useMyDownline() {
  return useQuery({
    queryKey: ['my-downline'],
    queryFn: async () =>
      (await api.get<{ directReferrals: DownlineUser[]; directReferralsCount: number }>('/network/my-downline'))
        .data,
  });
}

// Wallet
export function useMyWallet() {
  return useQuery({
    queryKey: ['my-wallet'],
    queryFn: async () => (await api.get<{ walletBalance: number }>('/wallet/me')).data.walletBalance,
  });
}

export function useMyWalletTransactions() {
  return useQuery({
    queryKey: ['my-wallet-transactions'],
    queryFn: async () =>
      (await api.get<{ transactions: WalletTransaction[] }>('/wallet/me/transactions')).data.transactions,
  });
}

export function useRanks() {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: async () => (await api.get<{ ranks: RankDefinition[] }>('/mlm/ranks')).data.ranks,
  });
}

export interface RankProgress {
  period: string;
  personalPV: number;
  teamPV: number; // compressed group PV, current period
  countsByRankName: Record<string, number>; // e.g. { 'Star Performer': 2, Diamond: 0 }
}

export function useMyRankProgress() {
  return useQuery({
    queryKey: ['my-rank-progress'],
    queryFn: async () => (await api.get<RankProgress>('/network/my-rank-progress')).data,
  });
}
