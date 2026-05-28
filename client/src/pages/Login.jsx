import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../services/api';
import toast from 'react-hot-toast';

const HOME = {
  manager:             '/dashboard',
  staff:               '/inventory',
  charity_coordinator: '/map',
  admin:               '/admin'
};

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      login(data.token, data.user);
      navigate(HOME[data.user.role] || '/dashboard');
      toast.success(`Welcome back, ${data.user.firstName}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for quick testing
  const demos = [
    { label: 'Manager',  email: 'manager@mkcafe.pl' },
    { label: 'Staff',    email: 'staff@mkcafe.pl' },
    { label: 'Charity',  email: 'coordinator@warsawfoodbank.pl' },
    { label: 'Admin',    email: 'admin@foodloop.city' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3 text-green-600">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900">FOODLOOP</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email" className="input" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password" className="input" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">
              Demo accounts — password: <strong>password123</strong>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demos.map(({ label, email: e }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setEmail(e); setPassword('password123'); }}
                  className="text-xs py-1.5 px-2 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}