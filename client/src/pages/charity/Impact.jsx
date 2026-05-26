import { useState, useEffect } from 'react';
import { getCharityImpact, getDonations } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { HeartIcon, ScaleIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Impact() {
  const [impact, setImpact]   = useState(null);
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCharityImpact(), getDonations({ status: 'completed' })])
      .then(([imp, data]) => {
        setImpact(imp);
        setClaims(data.listings || []);
      })
      .catch(() => toast.error('Failed to load impact'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const pct = impact
    ? (parseFloat(impact.reliabilityScore) * 100).toFixed(0)
    : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your impact</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total pickups"    value={impact?.totalPickups || 0}                           icon={CheckCircleIcon} color="brand" />
        <StatCard label="Kg collected"     value={`${parseFloat(impact?.totalKgCollected || 0).toFixed(1)}kg`} icon={ScaleIcon}       color="brand" />
        <StatCard label="Meals equivalent" value={(impact?.totalMealsEquivalent || 0).toLocaleString()} icon={UserGroupIcon}   color="blue"  />
        <StatCard label="Reliability"      value={`${pct}%`}                                            icon={HeartIcon}       color="brand" />
      </div>

      {/* Reliability bar */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Reliability score</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-brand-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xl font-bold text-brand-700 w-14 text-right">{pct}%</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {pct >= 90
            ? 'Excellent — you are one of the most reliable charities on the network.'
            : pct >= 70
            ? 'Good — keep completing claimed pickups to improve your score.'
            : 'Improving — a higher score means better matches from the system.'}
        </p>
      </div>

      {/* Recent pickups */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed pickups</h2>
        {claims.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No completed pickups yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {claims.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.product?.name}</p>
                  <p className="text-xs text-gray-400">{c.donor?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">{c.quantity} {c.unit}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.completedAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}