import { useState, useEffect } from 'react';
import { getDonations } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed, cancelled

  useEffect(() => {
    Promise.all([
      getDonations({ status: 'claimed' }),
      getDonations({ status: 'completed' }),
      getDonations({ status: 'cancelled' })
    ])
      .then(([claimed, completed, cancelled]) => {
        const all = [
          ...claimed.listings?.map(d => ({ ...d, claimStatus: 'pending' })) || [],
          ...completed.listings?.map(d => ({ ...d, claimStatus: 'completed' })) || [],
          ...cancelled.listings?.map(d => ({ ...d, claimStatus: 'cancelled' })) || []
        ];
        setClaims(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => toast.error('Failed to load claims'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = filter === 'all' 
    ? claims 
    : claims.filter(c => c.claimStatus === filter);

  const statusConfig = {
    pending: { icon: ClockIcon, color: 'yellow', label: 'Pending pickup' },
    completed: { icon: CheckCircleIcon, color: 'green', label: 'Completed' },
    cancelled: { icon: XCircleIcon, color: 'red', label: 'Cancelled' }
  };

  const statusCounts = {
    all: claims.length,
    pending: claims.filter(c => c.claimStatus === 'pending').length,
    completed: claims.filter(c => c.claimStatus === 'completed').length,
    cancelled: claims.filter(c => c.claimStatus === 'cancelled').length
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My claims</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'pending', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              filter === status
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Claims list */}
      <div className="card">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No {filter !== 'all' ? filter : ''} claims
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(claim => {
              const config = statusConfig[claim.claimStatus];
              const Icon = config.icon;
              return (
                <div key={claim.id} className="flex items-start justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-medium text-gray-900">{claim.product?.name}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium bg-${config.color}-100 text-${config.color}-700`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">From: {claim.donor?.name}</p>
                    <p className="text-xs text-gray-500">
                      Claimed: {new Date(claim.createdAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{claim.quantity} {claim.unit}</p>
                    <Icon className="w-5 h-5 text-gray-400 mt-2" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
