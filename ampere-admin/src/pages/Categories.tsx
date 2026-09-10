import React, { useState } from 'react';
import { Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '../api/hooks';
import type { Category } from '../api/types';
import { Button, Card, Input, Modal, PageHeader, Spinner, EmptyState } from '../components/ui';

const EMPTY_FORM = { name: '', subtitle: '', sortOrder: '0' };

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category._id);
    setForm({ name: category.name, subtitle: category.subtitle ?? '', sortOrder: String(category.sortOrder) });
    setModalOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, subtitle: form.subtitle, sortOrder: Number(form.sortOrder) };
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in it will keep pointing to a missing category.')) return;
    await deleteCategory.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        icon={Layers}
        description="Group products so customers can browse by type."
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Category
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading categories..." />
      ) : categories.length === 0 ? (
        <EmptyState icon={Layers} title="No categories yet" description="Add your first category to organize products." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category._id} hover className="flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent-border flex items-center justify-center mb-3">
                <Layers size={17} className="text-accent" />
              </div>
              <p className="text-fg font-semibold">{category.name}</p>
              <p className="text-muted text-xs mb-4 flex-1">{category.subtitle || '—'}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(category)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(category._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input
            placeholder="Subtitle (e.g. Care you can trust)"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
          <Button type="submit" loading={saving} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Category'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
