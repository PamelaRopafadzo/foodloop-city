import { useState, useEffect } from 'react';
import {
  getProducts, createProduct, updateProduct,
  deleteProduct, lookupOpenFoodFacts
} from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CATEGORIES = ['bakery','dairy','produce','meat','seafood','prepared','beverages','dry_goods','frozen','other'];

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [lookup, setLookup]       = useState('');
  const [form, setForm]           = useState({
    name: '', category: 'bakery', expiryDays: 3, unit: 'units', sku: ''
  });

  const load = () =>
    getProducts()
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleLookup = async () => {
    if (!lookup.trim()) return;
    try {
      const results = await lookupOpenFoodFacts(lookup);
      if (results.length > 0) {
        const p = results[0];
        setForm(f => ({ ...f, name: p.name, category: p.category, expiryDays: p.expiryDays }));
        toast.success('Product details filled from OpenFoodFacts');
      } else {
        toast('No results found — fill in manually');
      }
    } catch { toast.error('Lookup failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateProduct(editing.id, form);
        toast.success('Product updated');
      } else {
        await createProduct(form);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', category: 'bakery', expiryDays: 3, unit: 'units', sku: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setForm({
      name:       product.name,
      category:   product.category,
      expiryDays: product.expiryDays,
      unit:       product.unit,
      sku:        product.sku || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deactivated');
      load();
    } catch { toast.error('Failed to deactivate'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add product
        </button>
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="card border-brand-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editing ? 'Edit product' : 'New product'}
          </h2>

          {/* OpenFoodFacts lookup */}
          {!editing && (
            <div className="flex gap-2 mb-5 pb-5 border-b border-gray-100">
              <input
                type="text" className="input" placeholder="Search OpenFoodFacts..."
                value={lookup} onChange={e => setLookup(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
              />
              <button onClick={handleLookup} className="btn-secondary flex items-center gap-2 flex-shrink-0">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Lookup
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text" className="input" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="input" value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shelf life (days)
              </label>
              <input
                type="number" className="input" min="1" required
                value={form.expiryDays}
                onChange={e => setForm(f => ({ ...f, expiryDays: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                className="input" value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              >
                {['units','kg','g','l','ml','portions'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (optional)
              </label>
              <input
                type="text" className="input" placeholder="e.g. BAKE-001"
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end pt-2">
              <button
                type="button" className="btn-secondary"
                onClick={() => { setShowForm(false); setEditing(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editing ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products table */}
      <div className="card">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products yet — add your first one</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 px-2 font-medium text-gray-500">Name</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Category</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Shelf life</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Unit</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">SKU</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-2 font-medium text-gray-900">{p.name}</td>
                    <td className="py-3 px-2 text-gray-500 capitalize">{p.category}</td>
                    <td className="py-3 px-2 text-gray-500">{p.expiryDays}d</td>
                    <td className="py-3 px-2 text-gray-500">{p.unit}</td>
                    <td className="py-3 px-2 text-gray-400">{p.sku || '—'}</td>
                    <td className="py-3 px-2 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}