import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AdminUser,
  Banner,
  Category,
  Coupon,
  DashboardStats,
  DownlineUser,
  ManualPVGrant,
  MLMSettings,
  MonthlyPayoutRun,
  Order,
  PaymentSettings,
  Product,
  RankDefinition,
  WalletPayout,
  WalletTransaction,
  WalletUser,
} from './types';

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () =>
      (await api.get<{ stats: DashboardStats; recentOrders: Order[] }>('/admin/dashboard/stats')).data,
  });
}

// Categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ categories: Category[] }>('/categories')).data.categories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Category>) =>
      (await api.post<{ category: Category }>('/categories', payload)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Category> }) =>
      (await api.put<{ category: Category }>(`/categories/${id}`, payload)).data.category,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// Products
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get<{ products: Product[] }>('/products')).data.products,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Product>) =>
      (await api.post<{ product: Product }>('/products', payload)).data.product,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Product> }) =>
      (await api.put<{ product: Product }>(`/products/${id}`, payload)).data.product,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

// Orders
export function useOrders(filters: { orderStatus?: string; paymentStatus?: string } = {}) {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () =>
      (await api.get<{ orders: Order[] }>('/admin/orders', { params: filters })).data.orders,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { orderStatus?: string; paymentStatus?: string };
    }) => (await api.put<{ order: Order }>(`/admin/orders/${id}/status`, payload)).data.order,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

export function useUpdatePaymentSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) =>
      (
        await api.put<{ paymentSettings: PaymentSettings }>('/payment-settings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data.paymentSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-settings'] }),
  });
}

// Coupons
export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => (await api.get<{ coupons: Coupon[] }>('/coupons')).data.coupons,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Coupon>) =>
      (await api.post<{ coupon: Coupon }>('/coupons', payload)).data.coupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Coupon> }) =>
      (await api.put<{ coupon: Coupon }>(`/coupons/${id}`, payload)).data.coupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

// Users
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<{ users: AdminUser[] }>('/admin/users')).data.users,
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) =>
      (await api.put<{ user: AdminUser }>(`/admin/users/${id}`, { isBlocked })).data.user,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

// Upload
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return (
        await api.post<{ url: string }>('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data.url;
    },
  });
}

// MLM settings
export function useMLMSettings() {
  return useQuery({
    queryKey: ['mlm-settings'],
    queryFn: async () => (await api.get<{ mlmSettings: MLMSettings }>('/mlm-settings')).data.mlmSettings,
  });
}

export function useUpdateMLMSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MLMSettings>) =>
      (await api.put<{ mlmSettings: MLMSettings }>('/mlm-settings', payload)).data.mlmSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mlm-settings'] }),
  });
}

// Network
export function useUserDownline(userId?: string) {
  return useQuery({
    queryKey: ['network-downline', userId],
    queryFn: async () =>
      (await api.get<{ downline: DownlineUser[]; totalCount: number }>(`/admin/network/${userId}/downline`)).data,
    enabled: !!userId,
  });
}

// Wallet
export function useWalletBalances() {
  return useQuery({
    queryKey: ['wallet-balances'],
    queryFn: async () => (await api.get<{ users: WalletUser[] }>('/admin/payouts/wallets')).data.users,
  });
}

export function useUserWalletTransactions(userId?: string) {
  return useQuery({
    queryKey: ['wallet-transactions', userId],
    queryFn: async () =>
      (await api.get<{ transactions: WalletTransaction[] }>(`/admin/wallet/${userId}/transactions`)).data
        .transactions,
    enabled: !!userId,
  });
}

export function useRecordPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: { amount: number; method: string; reference: string; note?: string };
    }) => (await api.post<{ payout: WalletPayout }>(`/admin/payouts/${userId}/pay`, payload)).data.payout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      qc.invalidateQueries({ queryKey: ['payout-history'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
    },
  });
}

export function usePayoutHistory() {
  return useQuery({
    queryKey: ['payout-history'],
    queryFn: async () => (await api.get<{ payouts: WalletPayout[] }>('/admin/payouts/history')).data.payouts,
  });
}

// Ranks
export function useRanks() {
  return useQuery({
    queryKey: ['ranks'],
    queryFn: async () => (await api.get<{ ranks: RankDefinition[] }>('/mlm/ranks')).data.ranks,
  });
}

export function useCreateRank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RankDefinition>) =>
      (await api.post<{ rank: RankDefinition }>('/admin/mlm/ranks', payload)).data.rank,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranks'] }),
  });
}

export function useUpdateRank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<RankDefinition> }) =>
      (await api.put<{ rank: RankDefinition }>(`/admin/mlm/ranks/${id}`, payload)).data.rank,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranks'] }),
  });
}

export function useDeleteRank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/mlm/ranks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ranks'] }),
  });
}

// Monthly payout runs
export function useMonthlyPayoutRuns() {
  return useQuery({
    queryKey: ['monthly-payout-runs'],
    queryFn: async () =>
      (await api.get<{ runs: MonthlyPayoutRun[] }>('/admin/payouts/monthly-run/history')).data.runs,
  });
}

export function useRunMonthlyPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (period: string) =>
      (await api.post<{ run: MonthlyPayoutRun }>('/admin/payouts/monthly-run', { period })).data.run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monthly-payout-runs'] });
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
    },
  });
}

export function useVoidPayoutRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) =>
      (await api.post<{ run: MonthlyPayoutRun }>(`/admin/payouts/monthly-run/${runId}/void`)).data.run,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monthly-payout-runs'] });
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
    },
  });
}

// Manual PV grants
export function useUserGrants(userId?: string) {
  return useQuery({
    queryKey: ['pv-grants', userId],
    queryFn: async () => (await api.get<{ grants: ManualPVGrant[] }>(`/admin/pv-grants/${userId}`)).data.grants,
    enabled: !!userId,
  });
}

export function useGrantPV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, pv, reason }: { userId: string; pv: number; reason: string }) =>
      (await api.post<{ grant: ManualPVGrant }>('/admin/pv-grants', { userId, pv, reason })).data.grant,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pv-grants', vars.userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions', vars.userId] });
    },
  });
}

export function useRevokeGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ grantId }: { grantId: string; userId: string }) =>
      (await api.post<{ grant: ManualPVGrant }>(`/admin/pv-grants/${grantId}/revoke`)).data.grant,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['pv-grants', vars.userId] });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions', vars.userId] });
    },
  });
}

// Manual wallet credit (admin adds funds directly, distinct from the pay-out debit flow)
export function useCreditWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      (await api.post<{ walletBalance: number }>(`/admin/wallet/${userId}/credit`, { amount, reason })).data,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['wallet-balances'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions', vars.userId] });
    },
  });
}

// Banners
export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get<{ banners: Banner[] }>('/admin/banners')).data.banners,
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Banner>) =>
      (await api.post<{ banner: Banner }>('/admin/banners', payload)).data.banner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<Banner> }) =>
      (await api.put<{ banner: Banner }>(`/admin/banners/${id}`, payload)).data.banner,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}
