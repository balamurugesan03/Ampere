import { useState } from 'react';
import { Image as ImageIcon, ImagePlus, Plus, Pencil, Trash2, Link2 } from 'lucide-react';
import {
  useBanners,
  useCategories,
  useCreateBanner,
  useDeleteBanner,
  useProducts,
  useUpdateBanner,
  useUploadImage,
} from '../api/hooks';
import { resolveMediaUrl } from '../api/client';
import type { Banner } from '../api/types';
import {
  Badge,
  Button,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  EmptyState,
  Table,
  Th,
  Td,
  Tr,
} from '../components/ui';

interface FormState {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkType: 'none' | 'product' | 'category';
  linkId: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkType: 'none',
  linkId: '',
  sortOrder: '0',
  active: true,
};

export default function Banners() {
  const { data: banners = [], isLoading } = useBanners();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const uploadImage = useUploadImage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sortOrder: String(banners.length + 1) });
    setModalOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType,
      linkId: banner.linkId ?? '',
      sortOrder: String(banner.sortOrder),
      active: banner.active,
    });
    setModalOpen(true);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage.mutateAsync(file);
    setForm((f) => ({ ...f, imageUrl: url }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<Banner> = {
        title: form.title,
        subtitle: form.subtitle,
        imageUrl: form.imageUrl,
        linkType: form.linkType,
        linkId: form.linkType === 'none' ? undefined : form.linkId || undefined,
        sortOrder: Number(form.sortOrder),
        active: form.active,
      };
      if (editingId) {
        await updateBanner.mutateAsync({ id: editingId, payload });
      } else {
        await createBanner.mutateAsync(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await deleteBanner.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        title="Banners"
        icon={ImageIcon}
        description={'Banners appear on the app\'s Home screen. If more than one is active, customers can swipe between them. "Shop Now" navigates to the linked product or category, or does nothing if unlinked.'}
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Banner
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading banners..." />
      ) : banners.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No banners yet" description="Add a banner to promote products on the Home screen." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Image</Th>
              <Th>Title</Th>
              <Th>Link</Th>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => {
              const imgUrl = resolveMediaUrl(banner.imageUrl);
              return (
                <Tr key={banner._id}>
                  <Td>
                    {imgUrl ? (
                      <img src={imgUrl} alt="" className="w-20 h-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-20 h-12 rounded-lg bg-surface-2 border border-border" />
                    )}
                  </Td>
                  <Td className="text-fg whitespace-pre-line font-medium">{banner.title}</Td>
                  <Td className="text-muted">
                    {banner.linkType === 'none' ? (
                      '—'
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Link2 size={13} />
                        {banner.linkType}
                      </span>
                    )}
                  </Td>
                  <Td className="text-fg">{banner.sortOrder}</Td>
                  <Td>
                    <Badge tone={banner.active ? 'green' : 'default'}>{banner.active ? 'Active' : 'Inactive'}</Badge>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(banner)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(banner._id)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Banner' : 'Add Banner'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Title</label>
            <textarea
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle outline-none transition-all focus:border-accent-border focus:ring-4 focus:ring-accent-soft resize-none"
              rows={2}
              placeholder={'e.g. Your Health\nOur Priority'}
            />
          </div>
          <Input
            placeholder="Subtitle (e.g. Up to 30% Off)"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          />

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Banner Image
            </label>
            <label className="flex items-center gap-3 border border-dashed border-border-strong rounded-xl px-4 py-3 cursor-pointer hover:border-accent-border hover:bg-accent-soft/40 transition-colors">
              {form.imageUrl ? (
                <img src={resolveMediaUrl(form.imageUrl)} alt="" className="w-16 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                  <ImagePlus size={16} className="text-subtle" />
                </div>
              )}
              <span className="text-sm text-muted">{form.imageUrl ? 'Change image' : 'Click to upload an image'}</span>
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.linkType}
              onChange={(e) => setForm((f) => ({ ...f, linkType: e.target.value as FormState['linkType'], linkId: '' }))}
            >
              <option value="none">No link</option>
              <option value="product">Link to product</option>
              <option value="category">Link to category</option>
            </Select>
            <Input
              type="number"
              placeholder="Sort order"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>

          {form.linkType === 'product' && (
            <Select value={form.linkId} onChange={(e) => setForm((f) => ({ ...f, linkId: e.target.value }))} required>
              <option value="" disabled>
                Select product
              </option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          {form.linkType === 'category' && (
            <Select value={form.linkId} onChange={(e) => setForm((f) => ({ ...f, linkId: e.target.value }))} required>
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          <label className="flex items-center gap-2 text-sm text-fg cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="accent-accent"
            />
            Active
          </label>

          <Button type="submit" loading={saving} disabled={!form.imageUrl} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Banner'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
