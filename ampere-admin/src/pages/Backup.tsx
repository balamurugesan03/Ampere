import { useEffect, useState } from 'react';
import { DatabaseBackup, Download, FileSpreadsheet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Button, Card, PageHeader, Spinner } from '../components/ui';

interface BackupModule {
  key: string;
  label: string;
  count: number;
}

export default function Backup() {
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['backup-modules'],
    queryFn: async () => (await api.get<{ modules: BackupModule[] }>('/admin/backup/modules')).data.modules,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (modules.length && selected.size === 0) setSelected(new Set(modules.map((m) => m.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const allSelected = modules.length > 0 && selected.size === modules.length;
  const totalRecords = modules.filter((m) => selected.has(m.key)).reduce((s, m) => s + m.count, 0);

  const download = async (keys: string[], tag: string) => {
    setError('');
    setDownloading(tag);
    try {
      const res = await api.get('/admin/backup/export', {
        params: { modules: keys.join(',') },
        responseType: 'blob',
      });
      const disposition = String(res.headers['content-disposition'] ?? '');
      const name = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'ampere-backup.xlsx';
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Backup export failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Data Backup"
        description="Export module-wise data to Excel. Each module becomes a separate sheet in one .xlsx file."
        icon={DatabaseBackup}
        action={
          <Button
            icon={Download}
            loading={downloading === 'all'}
            disabled={!modules.length || downloading !== null}
            onClick={() => download(modules.map((m) => m.key), 'all')}
          >
            Export All Data
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-soft text-danger text-sm px-4 py-3">{error}</div>
      )}

      <Card>
        {isLoading ? (
          <Spinner label="Loading modules..." />
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm text-fg cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[var(--color-accent)] w-4 h-4"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(modules.map((m) => m.key)))}
                />
                Select all ({selected.size}/{modules.length} modules · {totalRecords.toLocaleString()} records)
              </label>
              <Button
                variant="secondary"
                icon={FileSpreadsheet}
                loading={downloading === 'selected'}
                disabled={selected.size === 0 || downloading !== null}
                onClick={() => download([...selected], 'selected')}
              >
                Export Selected
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {modules.map((m) => (
                <div
                  key={m.key}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    selected.has(m.key) ? 'border-accent-border bg-accent-soft' : 'border-border bg-surface-2'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer"
                    checked={selected.has(m.key)}
                    onChange={() => toggle(m.key)}
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(m.key)}>
                    <p className="text-sm font-semibold text-fg truncate">{m.label}</p>
                    <p className="text-xs text-muted">{m.count.toLocaleString()} records</p>
                  </div>
                  <button
                    title={`Export ${m.label} only`}
                    disabled={downloading !== null}
                    onClick={() => download([m.key], m.key)}
                    className="shrink-0 text-subtle hover:text-accent hover:bg-surface-hover rounded-lg p-2 transition-colors disabled:opacity-40"
                  >
                    <Download size={16} className={downloading === m.key ? 'animate-pulse text-accent' : ''} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
