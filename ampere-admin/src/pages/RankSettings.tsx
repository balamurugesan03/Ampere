import { useState } from 'react';
import { Trophy, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCreateRank, useDeleteRank, useRanks, useUpdateRank } from '../api/hooks';
import type { RankDefinition } from '../api/types';
import { Badge, Button, Input, Modal, PageHeader, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

interface FormState {
  name: string;
  sortOrder: string;
  minCumulativeTeamPV: string;
  minDirectReferrals: string;
  minTeamSize: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  sortOrder: '',
  minCumulativeTeamPV: '0',
  minDirectReferrals: '0',
  minTeamSize: '0',
};

export default function RankSettings() {
  const { data: ranks = [], isLoading } = useRanks();
  const createRank = useCreateRank();
  const updateRank = useUpdateRank();
  const deleteRank = useDeleteRank();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: String(ranks.length + 1) });
    setModalOpen(true);
  };

  const openEdit = (rank: RankDefinition) => {
    setEditingId(rank._id);
    setForm({
      name: rank.name,
      sortOrder: String(rank.sortOrder),
      minCumulativeTeamPV: String(rank.criteria.minCumulativeTeamPV),
      minDirectReferrals: String(rank.criteria.minDirectReferrals),
      minTeamSize: String(rank.criteria.minTeamSize),
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sortOrder: Number(form.sortOrder),
        criteria: {
          minCumulativeTeamPV: Number(form.minCumulativeTeamPV),
          minDirectReferrals: Number(form.minDirectReferrals),
          minTeamSize: Number(form.minTeamSize),
        },
      };
      if (editingId) {
        await updateRank.mutateAsync({ id: editingId, payload });
      } else {
        await createRank.mutateAsync(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this rank? Users currently holding it will lose the rank until recomputed.')) return;
    await deleteRank.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        title="Rank Settings"
        icon={Trophy}
        description="Ranks are recomputed automatically for a distributor's upline every time one of their team's orders is marked paid. A distributor qualifies for the highest rank whose criteria they meet. Bonus pools (in MLM Settings) unlock cumulatively based on a distributor's rank."
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Rank
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading ranks..." />
      ) : ranks.length === 0 ? (
        <EmptyState icon={Trophy} title="No ranks yet" description="Add your first rank tier." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Name</Th>
              <Th>Min Team PV</Th>
              <Th>Min Direct Referrals</Th>
              <Th>Min Team Size</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {ranks.map((rank) => (
              <Tr key={rank._id}>
                <Td className="text-muted">{rank.sortOrder}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-fg font-semibold">
                    <Trophy size={14} className="text-warning" />
                    {rank.name}
                  </span>
                </Td>
                <Td className="text-fg">{rank.criteria.minCumulativeTeamPV}</Td>
                <Td className="text-fg">{rank.criteria.minDirectReferrals}</Td>
                <Td className="text-fg">{rank.criteria.minTeamSize}</Td>
                <Td>
                  <Badge tone={rank.active ? 'green' : 'default'}>{rank.active ? 'Active' : 'Inactive'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(rank)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(rank._id)}>
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Rank' : 'Add Rank'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Name (e.g. Star Performer)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input
            type="number"
            placeholder="Sort order (1 = lowest rank)"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            required
          />
          <div>
            <label className="block text-xs text-subtle mb-1">Minimum cumulative team PV</label>
            <Input
              type="number"
              value={form.minCumulativeTeamPV}
              onChange={(e) => setForm((f) => ({ ...f, minCumulativeTeamPV: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Minimum direct referrals</label>
            <Input
              type="number"
              value={form.minDirectReferrals}
              onChange={(e) => setForm((f) => ({ ...f, minDirectReferrals: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Minimum team size</label>
            <Input
              type="number"
              value={form.minTeamSize}
              onChange={(e) => setForm((f) => ({ ...f, minTeamSize: e.target.value }))}
            />
          </div>
          <Button type="submit" loading={saving} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Rank'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
