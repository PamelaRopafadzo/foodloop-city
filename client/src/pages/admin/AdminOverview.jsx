import { useState, useEffect } from 'react';
import { getAdminStats, getAdminOrgs } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BuildingStorefrontIcon, UserGroupIcon, HeartIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminOverview() {
  const { on }                        = useSocket('admin');
  const [stats, setStats]             = useState(null);
  const [orgs, setOrgs]               = useState([]);
  const [liveEvents, setLiveEvents]   = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminOrgs({ limit: 8 })])
      .then(([s, o]) => { setStats(s); setOrgs(o.organisations || []); })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  // Live network feed — new events stream in via WebSocket
  useEffect(() => {
    const u1 = on('network:donation_created', (d) =>
      setLiveEvents(prev => [{ type: 'created', ...d, at: new Date() }, ...prev.slice(0, 9)])
    );
    const u2 = on('network:donation_completed', (d) =>
      setLiveEvents(prev => [{ type: 'completed', ...d, at: new Date() }, ...prev.slice(0, 9)])
    );
    return () => { u1(); u2(); };
  }, [on]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Network overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active orgs"     value={stats?.activeOrgs || 0}    icon={BuildingStorefrontIcon} color="brand" />
        <StatCard label="Active users"    value={stats?.totalUsers || 0}    icon={UserGroupIcon}          color="blue"  />
        <StatCard label="Total donations" value={stats?.totalDonations || 0} icon={HeartIcon}             color="brand" sub={`${stats?.completionRate || 0}% completion`} />
        <StatCard label="Meals served"    value={(stats?.totalMeals || 0).toLocaleString()} icon={ChartBarIcon} color="brand" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Organisations list */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organisations</h2>
          <div className="divide-y divide-gray-50">
            {orgs.map(org => (
              <div key={org.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{org.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{org.type} · {org.city}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  org.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live activity feed */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Live activity</h2>
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {liveEvents.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">Waiting for events...</p>
              <p className="text-gray-300 text-xs mt-1">
                Donations appear here in real time
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {liveEvents.map((e, i) => (
                <div key={i} className="flex items-start gap-3 py-2.5">
                  <span className="text-lg mt-0.5">
                    {e.type === 'created' ? '📦' : '✅'}
                  </span>
                  <div>
                    <p className="text-sm text-gray-800">
                      {e.type === 'created'
                        ? `New ${e.category} donation in ${e.city}`
                        : `Pickup complete · ${e.co2SavedKg}kg CO₂ saved`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}