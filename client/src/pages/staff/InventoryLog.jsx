import { useState, useEffect } from 'react';
import { getProducts, logInventory } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function InventoryLog() {
  const [products, setProducts] = useState([]);
  const [entries, setEntries]   = useState({});
  const [saving, setSaving]     = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  const update = (productId, field, value) =>
    setEntries(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));

  const save = async (product) => {
    const entry = entries[product.id];
    if (entry?.quantity === undefined || entry?.quantity === '') {
      return toast.error('Enter a quantity first');
    }

    setSaving(prev => ({ ...prev, [product.id]: true }));
    try {
      await logInventory({
        productId:  product.id,
        quantity:   parseFloat(entry.quantity),
        expiryDate: entry.expiryDate || null,
        eventType:  entry.eventType || 'stock_check',
        notes:      entry.notes || null
      });
      toast.success(`${product.name} saved`);
      // Clear the entry after saving
      setEntries(prev => {
        const next = { ...prev };
        delete next[product.id];
        return next;
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(prev => ({ ...prev, [product.id]: false }));
    }
  };

  if (loading) return <LoadingSpinner text="Loading products..." />;

  // Group by category for cleaner layout
  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Log stock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter current quantities then tap Save
        </p>
      </div>

      {Object.entries(grouped).map(([category, prods]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 capitalize">
            {category}
          </h2>
          <div className="space-y-3">
            {prods.map(product => {
              const entry    = entries[product.id] || {};
              const hasEntry = entry.quantity !== undefined && entry.quantity !== '';
              const isSaving = saving[product.id];

              return (
                <div
                  key={product.id}
                  className={`card !p-4 transition-all ${hasEntry ? 'ring-2 ring-brand-200' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">
                        {product.unit} · {product.expiryDays}d shelf life
                      </p>
                    </div>
                    {hasEntry && (
                      <button
                        onClick={() => save(product)} disabled={isSaving}
                        className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Quantity ({product.unit})
                      </label>
                      <input
                        type="number" min="0" step="0.1" className="input text-sm"
                        placeholder="0"
                        value={entry.quantity ?? ''}
                        onChange={e => update(product.id, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Expiry date</label>
                      <input
                        type="date" className="input text-sm"
                        value={entry.expiryDate || ''}
                        onChange={e => update(product.id, 'expiryDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        className="input text-sm"
                        value={entry.eventType || 'stock_check'}
                        onChange={e => update(product.id, 'eventType', e.target.value)}
                      >
                        <option value="stock_check">Stock check</option>
                        <option value="delivery">Delivery</option>
                        <option value="adjustment">Adjustment</option>
                        <option value="waste_logged">Waste logged</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notes</label>
                      <input
                        type="text" className="input text-sm" placeholder="Optional"
                        value={entry.notes || ''}
                        onChange={e => update(product.id, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {products.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>No products yet — ask your manager to add products first.</p>
        </div>
      )}
    </div>
  );
}