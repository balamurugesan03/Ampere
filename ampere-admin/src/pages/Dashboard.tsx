import { LayoutDashboard, Receipt, Wallet, Clock, Users2, PackageX } from 'lucide-react';
import { useDashboardStats } from '../api/hooks';
import { PageHeader, Badge, StatCard, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

export default function Dashboard() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" icon={LayoutDashboard} />
        <Spinner label="Loading dashboard..." />
      </div>
    );
  }

  const { stats, recentOrders } = data;

  const cards = [
    { label: 'Total Orders', value: stats.ordersCount, icon: Receipt, tone: 'default' as const },
    { label: 'Revenue (Paid)', value: `₹${stats.revenue.toLocaleString()}`, icon: Wallet, tone: 'green' as const },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, tone: 'yellow' as const },
    { label: 'Customers', value: stats.usersCount, icon: Users2, tone: 'default' as const },
    { label: 'Low Stock Products', value: stats.lowStockProducts, icon: PackageX, tone: 'red' as const },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" icon={LayoutDashboard} description="Store performance at a glance." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} tone={c.tone} />
        ))}
      </div>

      <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)] mb-4">Recent Orders</h2>
      <Table>
        <thead>
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Total</Th>
            <Th>Payment</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState icon={Receipt} title="No orders yet" description="Orders will show up here once customers start buying." />
              </td>
            </tr>
          )}
          {recentOrders.map((order) => (
            <Tr key={order._id}>
              <Td className="text-fg font-medium">#{order._id.slice(-6).toUpperCase()}</Td>
              <Td className="text-fg">{order.user?.name}</Td>
              <Td className="text-fg font-medium">₹{order.total}</Td>
              <Td>
                <Badge tone={order.paymentStatus === 'paid' ? 'green' : 'yellow'}>{order.paymentStatus}</Badge>
              </Td>
              <Td>
                <Badge>{order.orderStatus}</Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
