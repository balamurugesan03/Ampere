import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { useMLMSettings, useRanks, useUpdateMLMSettings } from '../api/hooks';
import type { BonusPool } from '../api/types';
import { Button, Card, Input, PageHeader, Select, Spinner } from '../components/ui';

export default function MLMSettingsPage() {
  const { data: settings, isLoading } = useMLMSettings();
  const { data: ranks = [] } = useRanks();
  const updateSettings = useUpdateMLMSettings();

  const [pvToInrRate, setPvToInrRate] = useState('1');
  const [selfPurchasePercent, setSelfPurchasePercent] = useState('10');
  const [teamLevelPercents, setTeamLevelPercents] = useState<string[]>(Array(10).fill('0'));
  const [pgpvThreshold, setPgpvThreshold] = useState('0');
  const [pgpvScope, setPgpvScope] = useState('self');
  const [bonusPools, setBonusPools] = useState<BonusPool[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setPvToInrRate(String(settings.pvToInrRate));
      setSelfPurchasePercent(String(settings.selfPurchasePercent));
      setTeamLevelPercents(settings.teamLevelPercents.map(String));
      setPgpvThreshold(String(settings.pgpvThreshold));
      setPgpvScope(settings.pgpvScope);
      setBonusPools(settings.bonusPools);
    }
  }, [settings]);

  const levelSum = teamLevelPercents.reduce((sum, v) => sum + (Number(v) || 0), 0);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings.mutateAsync({
      pvToInrRate: Number(pvToInrRate),
      selfPurchasePercent: Number(selfPurchasePercent),
      teamLevelPercents: teamLevelPercents.map((v) => Number(v) || 0),
      pgpvThreshold: Number(pgpvThreshold),
      pgpvScope: pgpvScope as any,
      bonusPools,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="MLM Settings" icon={SlidersHorizontal} />
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="MLM Settings"
        icon={SlidersHorizontal}
        description={
          'These values control every commission calculation across the app: how much ₹1 PV is worth, the Self Purchase Bonus percentage credited to the buyer, and how the Development Bonus splits across the 10 upline levels. PGPV Scope "Self + Full Team" uses compressed group PV (a downline member\'s own subtree stops counting toward you once they themselves reach Star Performer) - this is the scope the new rank chart\'s monthly maintenance relies on.'
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                PV to ₹ Rate
              </label>
              <Input type="number" step="0.01" value={pvToInrRate} onChange={(e) => setPvToInrRate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                Self Purchase Bonus %
              </label>
              <Input
                type="number"
                value={selfPurchasePercent}
                onChange={(e) => setSelfPurchasePercent(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Development Bonus % by level (sums to {levelSum}%)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {teamLevelPercents.map((val, i) => (
                <div key={i}>
                  <label className="block text-[10px] text-subtle mb-1">L{i + 1}</label>
                  <Input
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const next = [...teamLevelPercents];
                      next[i] = e.target.value;
                      setTeamLevelPercents(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                PGPV Threshold (monthly PV)
              </label>
              <Input type="number" value={pgpvThreshold} onChange={(e) => setPgpvThreshold(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
                PGPV Scope
              </label>
              <Select value={pgpvScope} onChange={(e) => setPgpvScope(e.target.value)}>
                <option value="self">Self only</option>
                <option value="self_plus_directs">Self + Direct Referrals</option>
                <option value="self_plus_team">Self + Full Team</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Company-PV Funds (12 incomes, % of total company monthly PV, unlocked at a minimum rank)
            </label>
            <div className="space-y-2">
              {bonusPools.map((pool, i) => (
                <div key={pool.key} className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm text-fg">{pool.label}</span>
                  <Input
                    type="number"
                    value={pool.percentOfCompanyPV}
                    onChange={(e) => {
                      const next = [...bonusPools];
                      next[i] = { ...next[i], percentOfCompanyPV: Number(e.target.value) || 0 };
                      setBonusPools(next);
                    }}
                  />
                  <Select
                    value={pool.minRankSortOrder}
                    onChange={(e) => {
                      const next = [...bonusPools];
                      next[i] = { ...next[i], minRankSortOrder: Number(e.target.value) };
                      setBonusPools(next);
                    }}
                  >
                    {ranks.map((r) => (
                      <option key={r._id} value={r.sortOrder}>
                        Requires {r.name}+
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" loading={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save MLM Settings'}
          </Button>
          {saved && (
            <p className="text-accent text-sm flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Saved.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
