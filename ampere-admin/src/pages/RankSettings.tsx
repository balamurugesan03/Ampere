import { useState } from 'react';
import { Trophy, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCreateRank, useDeleteRank, useRanks, useUpdateRank } from '../api/hooks';
import type { RankDefinition } from '../api/types';
import { Badge, Button, Input, Modal, PageHeader, Select, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

type RuleType = RankDefinition['ruleType'];

interface FormState {
  name: string;
  sortOrder: string;
  ruleType: RuleType;
  minCumulativeTeamPV: string;
  minMonthlyPGPV: string;
  requiredRankName: string;
  requiredCount: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  sortOrder: '',
  ruleType: 'gpv_threshold',
  minCumulativeTeamPV: '0',
  minMonthlyPGPV: '0',
  requiredRankName: '',
  requiredCount: '1',
};

function requirementSummary(rank: RankDefinition) {
  if (rank.ruleType === 'count_based') {
    return `${rank.countCriteria.requiredCount} × ${rank.countCriteria.requiredRankName ?? '—'}+`;
  }
  const parts = [`${rank.criteria.minCumulativeTeamPV} GPV`];
  if (rank.criteria.minMonthlyPGPV > 0) parts.push(`${rank.criteria.minMonthlyPGPV} PGPV/mo`);
  return parts.join(' + ');
}

export default function RankSettings() {
  const { data: ranks = [], isLoading } = useRanks();
  const createRank = useCreateRank();
  const updateRank = useUpdateRank();
  const deleteRank = useDeleteRank();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const sortedRanks = [...ranks].sort((a, b) => a.sortOrder - b.sortOrder);

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
      ruleType: rank.ruleType,
      minCumulativeTeamPV: String(rank.criteria?.minCumulativeTeamPV ?? 0),
      minMonthlyPGPV: String(rank.criteria?.minMonthlyPGPV ?? 0),
      requiredRankName: rank.countCriteria?.requiredRankName ?? '',
      requiredCount: String(rank.countCriteria?.requiredCount ?? 1),
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload =
        form.ruleType === 'gpv_threshold'
          ? {
              name: form.name,
              sortOrder: Number(form.sortOrder),
              ruleType: 'gpv_threshold' as const,
              criteria: {
                minCumulativeTeamPV: Number(form.minCumulativeTeamPV),
                minMonthlyPGPV: Number(form.minMonthlyPGPV),
              },
            }
          : {
              name: form.name,
              sortOrder: Number(form.sortOrder),
              ruleType: 'count_based' as const,
              countCriteria: {
                requiredRankName: form.requiredRankName,
                requiredCount: Number(form.requiredCount),
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
        description="Seeder..Star Performer are matched on cumulative/monthly PV thresholds. Bronze Star and above are matched by counting downline members who hold a given rank or higher, anywhere in the downline. Ranks recompute automatically as orders and manual PV grants come in."
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Rank
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading ranks..." />
      ) : sortedRanks.length === 0 ? (
        <EmptyState icon={Trophy} title="No ranks yet" description="Add your first rank tier." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Name</Th>
              <Th>Rule</Th>
              <Th>Requirement</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {sortedRanks.map((rank) => (
              <Tr key={rank._id}>
                <Td className="text-muted">{rank.sortOrder}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-fg font-semibold">
                    <Trophy size={14} className="text-warning" />
                    {rank.name}
                  </span>
                </Td>
                <Td className="text-subtle text-xs">{rank.ruleType === 'gpv_threshold' ? 'GPV threshold' : 'Count-based'}</Td>
                <Td className="text-fg">{requirementSummary(rank)}</Td>
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
            <label className="block text-xs text-subtle mb-1">Rule type</label>
            <Select value={form.ruleType} onChange={(e) => setForm((f) => ({ ...f, ruleType: e.target.value as RuleType }))}>
              <option value="gpv_threshold">GPV threshold (e.g. Seeder..Star Performer)</option>
              <option value="count_based">Count-based (e.g. Bronze Star..Double UCA)</option>
            </Select>
          </div>

          {form.ruleType === 'gpv_threshold' ? (
            <>
              <div>
                <label className="block text-xs text-subtle mb-1">Minimum cumulative team PV</label>
                <Input
                  type="number"
                  value={form.minCumulativeTeamPV}
                  onChange={(e) => setForm((f) => ({ ...f, minCumulativeTeamPV: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs text-subtle mb-1">
                  Minimum current-month PGPV (0 = not required — only Star Performer typically sets this)
                </label>
                <Input
                  type="number"
                  value={form.minMonthlyPGPV}
                  onChange={(e) => setForm((f) => ({ ...f, minMonthlyPGPV: e.target.value }))}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-subtle mb-1">Required rank (or higher) in the downline</label>
                <Select
                  value={form.requiredRankName}
                  onChange={(e) => setForm((f) => ({ ...f, requiredRankName: e.target.value }))}
                  required
                >
                  <option value="" disabled>
                    Select a rank
                  </option>
                  {sortedRanks.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-subtle mb-1">Required count, anywhere in the downline</label>
                <Input
                  type="number"
                  min={1}
                  value={form.requiredCount}
                  onChange={(e) => setForm((f) => ({ ...f, requiredCount: e.target.value }))}
                />
              </div>
            </>
          )}

          <Button type="submit" loading={saving} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Rank'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
