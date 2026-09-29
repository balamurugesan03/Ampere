import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Share2, Ban, CheckCircle2, Trophy, PlusCircle, Wallet, History, Undo2, UserPlus } from 'lucide-react';
import {
  useAdminUsers,
  useCreateAdminUser,
  useCreditWallet,
  useGrantPV,
  useRevokeGrant,
  useUpdateAdminUser,
  useUserGrants,
  useUserWalletTransactions,
} from '../api/hooks';
import type { AdminUser } from '../api/types';
import { Avatar, Badge, Button, Modal, PageHeader, Spinner, EmptyState, Table, Th, Td, Tr, Textarea, Input } from '../components/ui';

export default function Users() {
  const { data: users = [], isLoading } = useAdminUsers();
  const updateUser = useUpdateAdminUser();
  const navigate = useNavigate();

  const [grantTarget, setGrantTarget] = useState<AdminUser | null>(null);
  const [creditTarget, setCreditTarget] = useState<AdminUser | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AdminUser | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Users"
        icon={UsersIcon}
        description="Every distributor and customer in your network."
        action={
          <Button icon={UserPlus} onClick={() => setAddOpen(true)}>
            Add User
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading users..." />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No customers yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Referral Code</Th>
              <Th>Rank</Th>
              <Th>Wallet</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} size={30} />
                    <div>
                      <p className="text-fg font-medium">{user.name}</p>
                      <p className="text-subtle text-xs">{user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-muted">{user.referralCode}</Td>
                <Td>
                  {user.currentRank ? (
                    <span className="inline-flex items-center gap-1.5 text-fg">
                      <Trophy size={13} className="text-warning" />
                      {user.currentRank}
                    </span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Td>
                <Td className="text-fg font-medium">₹{user.walletBalance ?? 0}</Td>
                <Td>
                  <Badge tone={user.isBlocked ? 'red' : 'green'}>{user.isBlocked ? 'Blocked' : 'Active'}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2 flex-wrap">
                    <Button size="sm" variant="secondary" icon={Share2} onClick={() => navigate(`/network/${user._id}`)}>
                      Network
                    </Button>
                    <Button size="sm" variant="secondary" icon={PlusCircle} onClick={() => setGrantTarget(user)}>
                      Grant PV
                    </Button>
                    <Button size="sm" variant="secondary" icon={Wallet} onClick={() => setCreditTarget(user)}>
                      Credit Wallet
                    </Button>
                    <Button size="sm" variant="secondary" icon={History} onClick={() => setHistoryTarget(user)}>
                      History
                    </Button>
                    <Button
                      size="sm"
                      variant={user.isBlocked ? 'secondary' : 'danger'}
                      icon={user.isBlocked ? CheckCircle2 : Ban}
                      onClick={() => updateUser.mutate({ id: user._id, isBlocked: !user.isBlocked })}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
      <GrantPVModal user={grantTarget} onClose={() => setGrantTarget(null)} />
      <CreditWalletModal user={creditTarget} onClose={() => setCreditTarget(null)} />
      <HistoryModal user={historyTarget} onClose={() => setHistoryTarget(null)} />
    </div>
  );
}

const emptyUserForm = { name: '', email: '', phone: '', password: '', sponsorReferralCode: '' };

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createUser = useCreateAdminUser();
  const [form, setForm] = useState(emptyUserForm);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ user: AdminUser; sponsorName: string | null } | null>(null);

  const set = (key: keyof typeof emptyUserForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const close = () => {
    setForm(emptyUserForm);
    setError('');
    setCreated(null);
    onClose();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setCreated(await createUser.mutateAsync(form));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create user');
    }
  };

  const addAnother = () => {
    // Keep the sponsor so several IDs can be added under the same person in a row.
    setForm({ ...emptyUserForm, sponsorReferralCode: form.sponsorReferralCode });
    setCreated(null);
  };

  return (
    <Modal open={open} onClose={close} title="Add User">
      {created ? (
        <div className="space-y-4">
          <div className="border border-accent-border bg-accent-soft rounded-md p-4 text-center">
            <p className="text-xs text-subtle">Referral code for {created.user.name}</p>
            <p className="text-2xl font-bold text-accent tracking-wider mt-1">{created.user.referralCode}</p>
            <p className="text-xs text-subtle mt-2">
              {created.sponsorName ? `Sponsor: ${created.sponsorName}` : 'Top-level ID (no sponsor)'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addAnother} className="flex-1 justify-center">
              Add another
            </Button>
            <Button onClick={close} className="flex-1 justify-center">
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-xs text-subtle">
            The referral code is generated automatically in sequence (AMP0001, AMP0002, ...).
          </p>
          <div>
            <label className="block text-xs text-subtle mb-1">Name</label>
            <Input value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Email (login ID)</label>
            <Input type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Phone</label>
            <Input value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Password</label>
            <Input type="text" minLength={6} value={form.password} onChange={set('password')} required />
          </div>
          <div>
            <label className="block text-xs text-subtle mb-1">Sponsor referral code (empty = top-level ID)</label>
            <Input
              value={form.sponsorReferralCode}
              onChange={set('sponsorReferralCode')}
              placeholder="e.g. AMP0001"
              className="uppercase"
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" loading={createUser.isPending} className="w-full justify-center">
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      )}
    </Modal>
  );
}

function GrantPVModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const grantPV = useGrantPV();
  const [pv, setPv] = useState('');
  const [reason, setReason] = useState('');

  const close = () => {
    setPv('');
    setReason('');
    onClose();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await grantPV.mutateAsync({ userId: user._id, pv: Number(pv), reason });
    close();
  };

  return (
    <Modal open={!!user} onClose={close} title={`Grant PV — ${user?.name ?? ''}`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="text-xs text-subtle">
          Credits PV to this distributor exactly as a real purchase would: Self Purchase Bonus to them,
          Development Bonus to their qualifying upline, and a rank recompute. Use this when PV is owed from
          an offline reconciliation.
        </p>
        <div>
          <label className="block text-xs text-subtle mb-1">PV amount</label>
          <Input type="number" min={1} value={pv} onChange={(e) => setPv(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">Reason (required, shown on the ledger entry)</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
        </div>
        <Button type="submit" loading={grantPV.isPending} className="w-full justify-center">
          {grantPV.isPending ? 'Granting...' : 'Grant PV'}
        </Button>
      </form>
    </Modal>
  );
}

function CreditWalletModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const creditWallet = useCreditWallet();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const close = () => {
    setAmount('');
    setReason('');
    onClose();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await creditWallet.mutateAsync({ userId: user._id, amount: Number(amount), reason });
    close();
  };

  return (
    <Modal open={!!user} onClose={close} title={`Credit Wallet — ${user?.name ?? ''}`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <p className="text-xs text-subtle">
          Adds ₹ directly to this distributor's wallet. No PV or rank side effects — use Grant PV instead if the
          credit should also generate income.
        </p>
        <div>
          <label className="block text-xs text-subtle mb-1">Amount (₹)</label>
          <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-subtle mb-1">Reason (required, shown on the ledger entry)</label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
        </div>
        <Button type="submit" loading={creditWallet.isPending} className="w-full justify-center">
          {creditWallet.isPending ? 'Crediting...' : 'Credit Wallet'}
        </Button>
      </form>
    </Modal>
  );
}

function HistoryModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const { data: transactions = [], isLoading: loadingTx } = useUserWalletTransactions(user?._id);
  const { data: grants = [], isLoading: loadingGrants } = useUserGrants(user?._id);
  const revokeGrant = useRevokeGrant();

  return (
    <Modal open={!!user} onClose={onClose} title={`History — ${user?.name ?? ''}`}>
      <div className="space-y-5 max-h-[70vh] overflow-y-auto">
        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Manual PV Grants</h4>
          {loadingGrants ? (
            <Spinner label="Loading..." />
          ) : grants.length === 0 ? (
            <p className="text-xs text-subtle">No manual PV grants.</p>
          ) : (
            <div className="space-y-2">
              {grants.map((g) => (
                <div key={g._id} className="border border-border rounded-md p-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-fg font-medium">{g.pv} PV</span>
                    <div className="flex items-center gap-2">
                      <Badge tone={g.status === 'active' ? 'green' : 'default'}>{g.status}</Badge>
                      {g.status === 'active' && user && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Undo2}
                          loading={revokeGrant.isPending}
                          onClick={() => revokeGrant.mutate({ grantId: g._id, userId: user._id })}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-subtle mt-1">{g.reason}</p>
                  <p className="text-subtle mt-1">{new Date(g.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Wallet Transactions</h4>
          {loadingTx ? (
            <Spinner label="Loading..." />
          ) : transactions.length === 0 ? (
            <p className="text-xs text-subtle">No transactions yet.</p>
          ) : (
            <div className="space-y-1.5">
              {transactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between text-xs border-b border-border pb-1.5">
                  <div>
                    <span className="text-fg">
                      {tx.type}
                      {tx.level ? ` (L${tx.level})` : ''}
                    </span>
                    {tx.note && <p className="text-subtle">{tx.note}</p>}
                  </div>
                  <span className={tx.amount < 0 ? 'text-danger font-medium' : 'text-accent font-medium'}>
                    {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
