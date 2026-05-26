import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getRiskScores, createDonation } from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  ExclamationTriangleIcon, CheckCircleIcon,
  HeartIcon, ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user }                    = useAuth();
  const { on }                      = useSocket(user?.role, user?.organisationId);
  const [scores, setScores]         = useState([]);
  const [loading, setLoading]       = useState(true);

  const load = () =>
    getRiskScores()
      .then(setScores)
      .catch(() => toast.error('Failed to load risk scores'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Refresh risk scores when new inventory is logged by staff
  useEffect(() => {
    const unsub = on('inventory:updated', () => {
      getRiskScores().then(setScores).catch(() => {});
    });
    return unsub;
  }, [on]);

  if (loading) return <LoadingSpinner text="Computing risk scores..." />;

  const critical = scores.filter(s => s.tier === 'critical');
  const high     = scores.filter(s => s.tier === 'high');
  const watch    = scores.filter(s => s.tier === 'watch');
  const safe     = scores.filter(s => s.tier === 'safe');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">{user?.organisation?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Critical"        value={critical.length} icon={ExclamationTriangleIcon} color="red"    sub="Act now"          />
        <StatCard label="High risk"       value={high.length}     icon={ExclamationTriangleIcon} color="yellow" sub="Monitor closely"  />
        <StatCard label="Watching"        value={watch.length}    icon={ChartBarIcon}            color="blue"   sub="Check tomorrow"  />
        <StatCard label="Safe"            value={safe.length}     icon={CheckCircleIcon}         color="brand"  sub="No action needed" />
      </div>

      {/* Critical banner */}
      {critical.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-red-900">
              {critical.length} product{critical.length > 1 ? 's' : ''} need immediate action
            </h2>
          </div>
          <div className="space-y-2">
            {critical.map(s => (
              <CriticalRow key={s.productId} score={s} onDonated={load} />
            ))}
          </div>
        </div>
      )}

      {/* Full risk table */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">All products</h2>
          <span className="text-xs text-gray-400">Scores update on every stock log</span>
        </div>

        {scores.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500">No products scored yet — log some inventory first</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 px-2 font-medium text-gray-500">Product</th>
                  <th className="pb-3 px-2 font-medium text-gray-500">Category</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Stock</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Days left</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Expires in</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-center">Risk</th>
                  <th className="pb-3 px-2 font-medium text-gray-500 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {scores.map(s => (
                  <tr key={s.productId} className="hover:bg-gray-50/50">
                    <td className="py-3 px-2 font-medium text-gray-900">{s.productName}</td>
                    <td className="py-3 px-2 text-gray-500 capitalize">{s.category}</td>
                    <td className="py-3 px-2 text-right text-gray-700">
                      {s.currentStock} {s.unit}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700">
                      {s.daysOfStock}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-700">
                      {s.daysToExpiry}d
                    </td>
                    <td className="py-3 px-2 text-center">
                      <RiskBadge tier={s.tier} />
                    </td>
                    <td className="py-3 px-2 text-right text-gray-400 text-xs">
                      {(s.score * 100).toFixed(0)}%
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

// Inline donate button for critical products
function CriticalRow({ score, onDonated }) {
  const [loading, setLoading] = useState(false);

  const donate = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      await createDonation({
        productId:         score.productId,
        quantity:          score.currentStock,
        pickupWindowStart: now.toISOString(),
        pickupWindowEnd:   end.toISOString()
      });
      toast.success('Donation listing created!');
      onDonated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div>
        <span className="font-medium text-gray-900">{score.productName}</span>
        <span className="text-red-600 text-xs ml-2">
          {score.daysToExpiry}d to expiry · {score.currentStock} {score.unit} in stock
        </span>
      </div>
      <button
        onClick={donate} disabled={loading}
        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <HeartIcon className="h-3.5 w-3.5" />
        {loading ? 'Creating...' : 'Donate now'}
      </button>
    </div>
  );
}