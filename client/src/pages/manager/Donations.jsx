import { useState, useEffect } from 'react';
import { getDonations, cancelDonation } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Donations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = () =>
    getDonations()
      .then(data => setDonations(data.listings || []))
      .catch(() => toast.error('Failed to load donations'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this donation?')) return;
    try {
      await cancelDonation(id);
      toast.success('Donation cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  if (loading) return <LoadingSpinner />;

  const statusColor = {
    available: 'bg-green-100 text-green-700',
    claimed:   'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    expired:   'bg-yellow-100 text-yellow-700'
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Donations</h1>

      {donations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">No donations yet — create one from the dashboard</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 px-2 font-medium text-gray-500">Product</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Quantity</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Pickup window</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Claimed by</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Status</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donations.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-2 font-medium text-gray-900">
                      {d.product?.name || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {d.quantity} {d.unit}
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs">
                      {new Date(d.pickupWindowStart).toLocaleString('en-GB', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                      {' → '}
                      {new Date(d.pickupWindowEnd).toLocaleString('en-GB', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {d.claimedBy?.name || '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[d.status] || ''}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {d.status === 'available' && (
                        <button
                          onClick={() => handleCancel(d.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}