import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getDonationMap, claimDonation } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

// Fix Leaflet marker icons broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Colour-coded pin per food category
const COLORS = {
  bakery: '#f97316', dairy: '#3b82f6', produce: '#22c55e',
  meat: '#ef4444', prepared: '#8b5cf6', default: '#6b7280'
};

const colorPin = (category) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${COLORS[category] || COLORS.default};
    border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28]
});

const WARSAW = [52.2297, 21.0122];

export default function DonationMap() {
  const { user }                  = useAuth();
  const { on }                    = useSocket(user?.role, null, user?.organisation?.city);
  const [markers, setMarkers]     = useState([]);
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);
  const [claiming, setClaiming]   = useState(null);

  const load = () =>
    getDonationMap(user?.organisation?.city || 'Warsaw')
      .then(setMarkers)
      .catch(() => toast.error('Failed to load map'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // New donation pin appears live
  useEffect(() => {
    const unsub = on('donation:new', (d) => {
      setMarkers(prev => [...prev, d]);
      toast('📍 New donation nearby!');
    });
    return unsub;
  }, [on]);

  // Pin disappears when claimed or cancelled
  useEffect(() => {
    const u1 = on('donation:claimed',   ({ id }) => setMarkers(p => p.filter(m => m.id !== id)));
    const u2 = on('donation:cancelled', ({ id }) => setMarkers(p => p.filter(m => m.id !== id)));
    return () => { u1(); u2(); };
  }, [on]);

  const claim = async (id) => {
    setClaiming(id);
    try {
      await claimDonation(id);
      setMarkers(prev => prev.filter(m => m.id !== id));
      toast.success('Donation claimed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to claim');
    } finally { setClaiming(null); }
  };

  const categories = ['all', ...new Set(markers.map(m => m.category))];
  const filtered   = filter === 'all' ? markers : markers.filter(m => m.category === filter);

  if (loading) return <LoadingSpinner text="Loading map..." />;

  return (
    <div className="flex flex-col h-screen">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Donation map</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} available · Live
            <span className="inline-block ml-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat} onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium capitalize transition-colors ${
                filter === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer center={WARSAW} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map(m => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={colorPin(m.category)}>
              <Popup minWidth={210}>
                <div className="py-1">
                  <p className="font-semibold text-gray-900 mb-0.5">{m.product}</p>
                  <p className="text-sm text-gray-600">{m.donorName}</p>
                  <p className="text-xs text-gray-400 mb-2">{m.donorAddress}</p>
                  <p className="text-sm text-gray-700 mb-1">
                    <strong>{m.quantity}</strong> {m.unit}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Pick up by {new Date(m.pickupWindowEnd).toLocaleString('en-GB', {
                      hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
                    })}
                  </p>
                  <button
                    onClick={() => claim(m.id)}
                    disabled={claiming === m.id}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {claiming === m.id ? 'Claiming...' : 'Claim donation'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}