import React, { useState } from 'react';
import { Wallet, PlayCircle, Ban, AlertCircle } from 'lucide-react';
import {
  useMonthlyPayoutRuns,
  usePayoutHistory,
  useRecordPayout,
  useRunMonthlyPayout,
  useVoidPayoutRun,
  useWalletBalances,
} from '../api/hooks';
import type { WalletUser } from '../api/types';
import { Badge, Button, Card, Input, Modal, PageHeader, Spinner, EmptyState, Table, Th, Td, Tr } from '../components/ui';

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Payouts() {
  const { data: users = [], isLoading } = useWalletBalances();
  const { data: history = [] } = usePayoutHistory();
  const recordPayout = useRecordPayout();

  const { data: runs = [] } = useMonthlyPayoutRuns();
  const runPayout = useRunMonthlyPayout();
  const voidRun = useVoidPayoutRun();
  const [period, setPeriod] = useState(currentPeriod());
  const [runError, setRunError] = useState('');

  const [selected, setSelected] = useState<WalletUser | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const alreadyRunForPeriod = runs.some((r) => r.period === period && r.status === 'completed');

  const onRunPayout = async () => {
    setRunError('');
    try {
      await runPayout.mutateAsync(period);
    } catch (err: any) {
      setRunError(err?.response?.data?.message || 'Payout run failed');
    }
  };

  const openPayModal = (user: WalletUser) => {
    setSelected(user);
    setAmount(String(user.walletBalance));
    setMethod('Bank Transfer');
    setReference('');
    setNote('');
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    try {
      await recordPayout.mutateAsync({
        userId: selected._id,
        payload: { amount: Number(amount), method, reference, note },
      });
      setSelected(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Payout failed');
    }
  };

  return (
    <div>
      <PageHeader
        title="Payouts"
        icon={Wallet}
        description="Distributor wallet balances accumulate from Self Purchase and Team Development Income. Pay distributors manually (bank transfer / UPI) outside the app, then record it here — the amount is deducted from their wallet balance immediately."
      />

      <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)] mb-4">Wallet Balances</h2>
      {isLoading ? (
        <Spinner label="Loading wallets..." />
      ) : users.length === 0 ? (
        <EmptyState icon={Wallet} title="No wallets yet" />
      ) : (
        <div className="mb-8">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Referral Code</Th>
                <Th>Balance</Th>
                <Th align="right"></Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <Tr key={user._id}>
                  <Td className="text-fg">{user.name}</Td>
                  <Td className="text-muted">{user.referralCode}</Td>
                  <Td className="text-fg font-semibold">₹{user.walletBalance}</Td>
                  <Td align="right">
                    <Button size="sm" variant="secondary" disabled={user.walletBalance <= 0} onClick={() => openPayModal(user)}>
                      Mark Paid
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)] mb-2">
        Monthly Bonus Pool Payout Run
      </h2>
      <p className="text-muted text-sm mb-4 max-w-2xl">
        Distributes the company-wide bonus pools (Performance, Gold Coin, Travel, Car, House, Profit
        Share) configured in MLM Settings, split equally among all rank-qualified, PGPV-active
        distributors for the chosen month. Each period can only be run once — void a run to correct it
        and re-run.
      </p>
      <Card className="max-w-lg mb-8">
        {!!runError && (
          <div className="flex items-center gap-2 bg-danger-soft border border-danger/30 text-danger text-sm rounded-xl px-3.5 py-2.5 mb-3">
            <AlertCircle size={15} className="shrink-0" />
            {runError}
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Period (YYYY-MM)
            </label>
            <Input value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <Button icon={PlayCircle} loading={runPayout.isPending} disabled={alreadyRunForPeriod} onClick={onRunPayout}>
            {alreadyRunForPeriod ? 'Already Run' : 'Run Payout'}
          </Button>
        </div>
      </Card>

      <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)] mb-4">Payout Run History</h2>
      {runs.length === 0 ? (
        <div className="mb-8">
          <EmptyState icon={PlayCircle} title="No payout runs yet" />
        </div>
      ) : (
        <div className="mb-8">
          <Table>
            <thead>
              <tr>
                <Th>Period</Th>
                <Th>Company PV</Th>
                <Th>Pools</Th>
                <Th>Status</Th>
                <Th align="right"></Th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <Tr key={run._id}>
                  <Td className="text-fg font-medium align-top">{run.period}</Td>
                  <Td className="text-fg align-top">{run.totalCompanyPV}</Td>
                  <Td className="text-muted align-top">
                    {run.pools
                      .filter((p) => p.qualifyingUserCount > 0)
                      .map((p) => `${p.label}: ₹${p.poolAmountInr} / ${p.qualifyingUserCount} people`)
                      .join(', ') || 'No qualifying distributors'}
                  </Td>
                  <Td className="align-top">
                    <Badge tone={run.status === 'completed' ? 'green' : 'default'}>{run.status}</Badge>
                  </Td>
                  <Td align="right" className="align-top">
                    {run.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={Ban}
                        onClick={() => confirm(`Void the ${run.period} payout run?`) && voidRun.mutate(run._id)}
                      >
                        Void
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h2 className="text-lg font-bold text-fg font-[family-name:var(--font-display)] mb-4">Payout History</h2>
      {history.length === 0 ? (
        <EmptyState icon={Wallet} title="No payouts recorded yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Name</Th>
              <Th>Amount</Th>
              <Th>Method</Th>
              <Th>Reference</Th>
            </tr>
          </thead>
          <tbody>
            {history.map((p) => (
              <Tr key={p._id}>
                <Td className="text-muted">{new Date(p.paidAt).toLocaleDateString()}</Td>
                <Td className="text-fg">{p.user?.name}</Td>
                <Td className="text-fg font-medium">₹{p.amount}</Td>
                <Td className="text-muted">{p.method}</Td>
                <Td className="text-muted">{p.reference}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Mark Paid — ${selected?.name ?? ''}`}>
        <form onSubmit={onSubmit} className="space-y-3">
          {!!error && (
            <div className="flex items-center gap-2 bg-danger-soft border border-danger/30 text-danger text-sm rounded-xl px-3.5 py-2.5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Amount (wallet balance: ₹{selected?.walletBalance})
            </label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Method</label>
            <Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank Transfer / UPI" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Reference (UTR/txn id)
            </label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Note</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" loading={recordPayout.isPending} className="w-full mt-2 justify-center">
            {recordPayout.isPending ? 'Recording...' : 'Confirm Payout'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
