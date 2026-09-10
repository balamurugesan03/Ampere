import { useState } from 'react';
import { ShoppingCart, Eye, MapPin, Package, CheckCircle2 } from 'lucide-react';
import { useOrders, useUpdateOrderStatus } from '../api/hooks';
import type { Order } from '../api/types';
import { Badge, Button, Modal, PageHeader, Select, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

const ORDER_STATUSES = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const { data: orders = [], isLoading } = useOrders({
    orderStatus: orderStatus || undefined,
    paymentStatus: paymentStatus || undefined,
  });
  const updateStatus = useUpdateOrderStatus();
  const [selected, setSelected] = useState<Order | null>(null);

  return (
    <div>
      <PageHeader title="Orders" icon={ShoppingCart} description="Track and fulfill customer orders." />

      <div className="flex gap-3 mb-5 max-w-md">
        <Select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
          <option value="">All order statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
          <option value="">All payment statuses</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
        </Select>
      </div>

      {isLoading ? (
        <Spinner label="Loading orders..." />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No orders match this filter" description="Try a different filter combination." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Total</Th>
              <Th>Method</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Tr key={order._id}>
                <Td className="text-fg font-medium">#{order._id.slice(-6).toUpperCase()}</Td>
                <Td className="text-fg">{order.user?.name}</Td>
                <Td className="text-fg font-medium">₹{order.total}</Td>
                <Td className="text-muted">{order.paymentMethod === 'UPI_QR' ? 'UPI' : 'COD'}</Td>
                <Td>
                  <Badge tone={order.paymentStatus === 'paid' ? 'green' : 'yellow'}>{order.paymentStatus}</Badge>
                </Td>
                <Td>
                  <Badge>{order.orderStatus}</Badge>
                </Td>
                <Td align="right">
                  <Button size="sm" variant="secondary" icon={Eye} onClick={() => setSelected(order)}>
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?._id.slice(-6).toUpperCase() ?? ''}`}>
        {selected && (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Customer</p>
              <p className="text-fg font-medium">
                {selected.user?.name} · {selected.user?.email}
              </p>
              {selected.user?.phone && <p className="text-muted">{selected.user.phone}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <MapPin size={12} /> Delivery Address
              </p>
              <p className="text-fg font-medium">
                {selected.address.contactName}, {selected.address.phone}
              </p>
              <p className="text-muted">
                {selected.address.line}, {selected.address.city}, {selected.address.state} {selected.address.pincode}
              </p>
              {selected.deliverySlot && <p className="text-muted mt-1">Slot: {selected.deliverySlot}</p>}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Package size={12} /> Items
              </p>
              <div className="space-y-1.5">
                {selected.items.map((item) => (
                  <div key={item.product} className="flex justify-between text-fg">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-2.5 pt-2.5 flex justify-between text-fg font-bold">
                <span>Total</span>
                <span>₹{selected.total}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Order Status</p>
                <Select
                  value={selected.orderStatus}
                  onChange={(e) => {
                    updateStatus.mutate({ id: selected._id, payload: { orderStatus: e.target.value } });
                    setSelected({ ...selected, orderStatus: e.target.value as Order['orderStatus'] });
                  }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Payment Status</p>
                {selected.paymentStatus === 'paid' ? (
                  <Badge tone="green">Paid</Badge>
                ) : (
                  <Button
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => {
                      updateStatus.mutate({ id: selected._id, payload: { paymentStatus: 'paid' } });
                      setSelected({ ...selected, paymentStatus: 'paid' });
                    }}
                  >
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
