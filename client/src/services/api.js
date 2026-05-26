import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear token and go to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);

export const register = (data) =>
  api.post('/auth/register', data).then(r => r.data);

export const getMe = () =>
  api.get('/auth/me').then(r => r.data);

// ── Products ──────────────────────────────────────────────────────────────
export const getProducts = (params) =>
  api.get('/products', { params }).then(r => r.data);

export const createProduct = (data) =>
  api.post('/products', data).then(r => r.data);

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then(r => r.data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then(r => r.data);

export const lookupOpenFoodFacts = (query) =>
  api.get('/products/lookup/openfoodfacts', { params: { query } }).then(r => r.data);

// ── Inventory ─────────────────────────────────────────────────────────────
export const getCurrentStock = () =>
  api.get('/inventory/current').then(r => r.data);

export const logInventory = (data) =>
  api.post('/inventory', data).then(r => r.data);

export const bulkLogInventory = (events) =>
  api.post('/inventory/bulk', { events }).then(r => r.data);

// ── Sales ─────────────────────────────────────────────────────────────────
export const logSales = (data) =>
  api.post('/sales', data).then(r => r.data);

// ── Donations ─────────────────────────────────────────────────────────────
export const getDonations = (params) =>
  api.get('/donations', { params }).then(r => r.data);

export const getDonationMap = (city) =>
  api.get('/donations/map', { params: { city } }).then(r => r.data);

export const createDonation = (data) =>
  api.post('/donations', data).then(r => r.data);

export const claimDonation = (id) =>
  api.post(`/donations/${id}/claim`).then(r => r.data);

export const completeDonation = (id, data) =>
  api.post(`/donations/${id}/complete`, data).then(r => r.data);

export const cancelDonation = (id) =>
  api.post(`/donations/${id}/cancel`).then(r => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────
export const getRiskScores = () =>
  api.get('/analytics/risk').then(r => r.data);

export const getWasteSummary = () =>
  api.get('/analytics/waste-summary').then(r => r.data);

export const getSalesTrend = () =>
  api.get('/analytics/sales-trend').then(r => r.data);

export const getDonationsSummary = () =>
  api.get('/analytics/donations-summary').then(r => r.data);

export const getCharityImpact = () =>
  api.get('/analytics/charity/impact').then(r => r.data);

export const getAdminStats = () =>
  api.get('/analytics/admin/stats').then(r => r.data);

// ── Reports ───────────────────────────────────────────────────────────────
export const getWeeklyReport = () =>
  api.get('/reports/weekly').then(r => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────
export const getAdminOrgs = (params) =>
  api.get('/admin/organisations', { params }).then(r => r.data);

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params }).then(r => r.data);