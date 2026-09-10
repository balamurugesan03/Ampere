import React, { useState } from 'react';
import { Ticket, Plus, Power, Trash2 } from 'lucide-react';
import { useCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon } from '../api/hooks';
import { Badge, Button, Input, Modal, PageHeader, Select, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

const EMPTY_FORM = { code: '', discountType: 'percent', discountValue: '', minOrderValue: '0' };

export default function Coupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCoupon.mutateAsync({
        code: form.code,
        discountType: form.discountType as 'flat' | 'percent',
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue),
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await deleteCoupon.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        icon={Ticket}
        description="Discount codes customers can apply at checkout."
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Coupon
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading coupons..." />
      ) : coupons.length === 0 ? (
        <EmptyState icon={Ticket} title="No coupons yet" description="Create a coupon code to offer discounts." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Min Order</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <Tr key={coupon._id}>
                <Td>
                  <span className="text-fg font-bold tracking-wide bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs">
                    {coupon.code}
                  </span>
                </Td>
                <Td className="text-fg font-medium">
                  {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                </Td>
                <Td className="text-muted">₹{coupon.minOrderValue}</Td>
                <Td>
                  <Badge tone={coupon.active ? 'green' : 'default'}>{coupon.active ? 'Active' : 'Inactive'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Power}
                      onClick={() => updateCoupon.mutate({ id: coupon._id, payload: { active: !coupon.active } })}
                    >
                      {coupon.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(coupon._id)}>
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Coupon">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            placeholder="Code (e.g. WELCOME10)"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat off</option>
            </Select>
            <Input
              type="number"
              placeholder="Discount value"
              value={form.discountValue}
              onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
              required
            />
          </div>
          <Input
            type="number"
            placeholder="Minimum order value"
            value={form.minOrderValue}
            onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
          />
          <Button type="submit" loading={saving} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Coupon'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
