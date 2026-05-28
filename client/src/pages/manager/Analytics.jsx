import { useState, useEffect } from 'react';
import {
  getWasteSummary, getSalesTrend,
  getDonationsSummary, getWeeklyReport
} from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from 'recharts';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { HeartIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Analytics() {
  const [waste, setWaste]           = useState([]);
  const [trend, setTrend]           = useState([]);
  const [donations, setDonations]   = useState(null);
  const [report, setReport]         = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([getWasteSummary(), getSalesTrend(), getDonationsSummary()])
      .then(([w, t, d]) => { setWaste(w); setTrend(t); setDonations(d); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const r = await getWeeklyReport();
      setReport(r);
    } catch { toast.error('Failed to generate report'); }
    finally { setReportLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  // Format trend data for the chart
  const trendData = trend.map(t => ({
    date:  t.saleDate?.slice(5),   // show MM-DD
    sales: parseFloat(t.totalSold || 0)
  }));

  // Format waste data for the chart
  const wasteData = waste.map(w => ({
    category: w.category,
    wasted:   parseFloat(w.totalWasted || 0),
    donated:  parseFloat(w.totalDonated || 0)
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Donation stats */}
      {donations && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total donations"    value={donations.total}            icon={HeartIcon}   color="brand" />
          <StatCard label="Completed"          value={donations.completed}        icon={HeartIcon}   color="brand" />
          <StatCard label="Completion rate"    value={`${donations.completionRate}%`} icon={ChartBarIcon} color="blue" />
          <StatCard label="CO₂ saved"          value={`${donations.co2SavedKg}kg`}   icon={ChartBarIcon} color="brand" sub="Estimated" />
        </div>
      )}

      {/* Sales trend */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales trend — last 14 days
        </h2>
        {trendData.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No sales data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone" dataKey="sales"
                stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Waste by category */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Waste vs donations — last 30 days
        </h2>
        {wasteData.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            No waste events logged yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wasteData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="wasted"  fill="#ef4444" radius={[4, 4, 0, 0]} name="Wasted"  />
              <Bar dataKey="donated" fill="#16a34a" radius={[4, 4, 0, 0]} name="Donated" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly report */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Weekly report</h2>
          </div>
          <button
            onClick={loadReport} disabled={reportLoading}
            className="btn-primary text-sm"
          >
            {reportLoading ? 'Generating...' : report ? 'Regenerate' : 'Generate report'}
          </button>
        </div>

        {report ? (
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {report.report}
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">
              Click "Generate report" to generate a report of this week's waste and donations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}