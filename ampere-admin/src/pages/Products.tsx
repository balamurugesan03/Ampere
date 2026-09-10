import React, { useState } from 'react';
import { Package, Plus, Pencil, Trash2, Star, TrendingUp, ImagePlus } from 'lucide-react';
import {
  useCategories,
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
  useUploadImage,
} from '../api/hooks';
import { resolveMediaUrl } from '../api/client';
import type { Product } from '../api/types';
import {
  Button,
  Input,
  Textarea,
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
  name: string;
  subtitle: string;
  description: string;
  price: string;
  mrp: string;
  pv: string;
  stock: string;
  category: string;
  isFeatured: boolean;
  isTrending: boolean;
  images: string[];
}

const EMPTY_FORM: FormState = {
  name: '',
  subtitle: '',
  description: '',
  price: '',
  mrp: '',
  pv: '',
  stock: '',
  category: '',
  isFeatured: false,
  isTrending: false,
  images: [],
};

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadImage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?._id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      subtitle: product.subtitle ?? '',
      description: product.description ?? '',
      price: String(product.price),
      mrp: String(product.mrp),
      pv: String(product.pv),
      stock: String(product.stock),
      category: typeof product.category === 'string' ? product.category : product.category._id,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      images: product.images ?? [],
    });
    setModalOpen(true);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage.mutateAsync(file);
    setForm((f) => ({ ...f, images: [url] }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        subtitle: form.subtitle,
        description: form.description,
        price: Number(form.price),
        mrp: Number(form.mrp),
        pv: Number(form.pv),
        stock: Number(form.stock),
        category: form.category,
        isFeatured: form.isFeatured,
        isTrending: form.isTrending,
        images: form.images,
      };
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        icon={Package}
        description="Manage your catalog, pricing and PV values."
        action={
          <Button icon={Plus} onClick={openCreate}>
            Add Product
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add your first product to start building the catalog."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Add Product
            </Button>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>PV</Th>
              <Th>Stock</Th>
              <Th align="right"></Th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const imgUrl = resolveMediaUrl(product.images?.[0]);
              return (
                <Tr key={product._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {imgUrl ? (
                        <img src={imgUrl} alt="" className="w-11 h-11 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
                          <Package size={16} className="text-subtle" />
                        </div>
                      )}
                      <div>
                        <p className="text-fg font-semibold flex items-center gap-1.5">
                          {product.name}
                          {product.isFeatured && <Star size={12} className="text-warning fill-warning" />}
                          {product.isTrending && <TrendingUp size={12} className="text-accent" />}
                        </p>
                        <p className="text-subtle text-xs">{product.subtitle}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted">
                    {typeof product.category === 'string' ? product.category : product.category.name}
                  </Td>
                  <Td className="text-fg font-medium">
                    ₹{product.price}
                    {product.mrp > product.price && (
                      <span className="text-subtle line-through ml-1.5 text-xs font-normal">₹{product.mrp}</span>
                    )}
                  </Td>
                  <Td className="text-fg">{product.pv}</Td>
                  <Td className={product.stock <= 5 ? 'text-danger font-medium' : 'text-fg'}>{product.stock}</Td>
                  <Td align="right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(product)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" icon={Trash2} onClick={() => onDelete(product._id)}>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input placeholder="Subtitle (e.g. 60 Tablets)" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            <Input type="number" placeholder="MRP" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} required />
            <Input type="number" placeholder="PV" value={form.pv} onChange={(e) => setForm((f) => ({ ...f, pv: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required />
            <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              Product Image
            </label>
            <label className="flex items-center gap-3 border border-dashed border-border-strong rounded-xl px-4 py-3 cursor-pointer hover:border-accent-border hover:bg-accent-soft/40 transition-colors">
              {form.images[0] ? (
                <img src={resolveMediaUrl(form.images[0])} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                  <ImagePlus size={18} className="text-subtle" />
                </div>
              )}
              <span className="text-sm text-muted">{form.images[0] ? 'Change image' : 'Click to upload an image'}</span>
              <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex gap-5 text-sm text-fg pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="accent-accent"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isTrending}
                onChange={(e) => setForm((f) => ({ ...f, isTrending: e.target.checked }))}
                className="accent-accent"
              />
              Trending
            </label>
          </div>

          <Button type="submit" loading={saving} className="w-full mt-2 justify-center">
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
