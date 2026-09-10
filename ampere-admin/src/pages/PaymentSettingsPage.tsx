import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, ImagePlus } from 'lucide-react';
import { usePaymentSettings, useUpdatePaymentSettings } from '../api/hooks';
import { resolveMediaUrl } from '../api/client';
import { Button, Card, Input, PageHeader, Spinner } from '../components/ui';

export default function PaymentSettingsPage() {
  const { data: settings, isLoading } = usePaymentSettings();
  const updateSettings = useUpdatePaymentSettings();

  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setUpiId(settings.upiId);
      setPayeeName(settings.payeeName);
    }
  }, [settings]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : undefined);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('upiId', upiId);
    formData.append('payeeName', payeeName);
    if (file) formData.append('qrImage', file);
    await updateSettings.mutateAsync(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Payment Settings" icon={CreditCard} />
        <Spinner />
      </div>
    );
  }

  const currentQrUrl = preview ?? resolveMediaUrl(settings?.qrImageUrl);

  return (
    <div>
      <PageHeader
        title="Payment Settings"
        icon={CreditCard}
        description="This UPI QR code and ID are shown to customers on the app's Payment screen. Since there is no payment gateway, customers pay manually via this QR and you confirm the order as “Paid” from the Orders page once you've verified the transfer."
      />

      <Card className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">UPI ID</label>
            <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourstore@upi" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Payee Name
            </label>
            <Input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} placeholder="Ampere Health Store" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              QR Code Image
            </label>
            <label className="flex items-center gap-3 border border-dashed border-border-strong rounded-xl px-4 py-3 cursor-pointer hover:border-accent-border hover:bg-accent-soft/40 transition-colors">
              {currentQrUrl ? (
                <img src={currentQrUrl} alt="QR" className="w-14 h-14 rounded-lg object-contain bg-white p-1" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                  <ImagePlus size={18} className="text-subtle" />
                </div>
              )}
              <span className="text-sm text-muted">{currentQrUrl ? 'Change QR image' : 'Click to upload a QR image'}</span>
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>
          <Button type="submit" loading={updateSettings.isPending}>
            {updateSettings.isPending ? 'Saving...' : 'Save Payment Settings'}
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
