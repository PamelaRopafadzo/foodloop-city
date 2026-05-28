import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

import Login          from './pages/Login';
import Dashboard      from './pages/manager/Dashboard';
import Analytics      from './pages/manager/Analytics';
import Products       from './pages/manager/Products';
import InventoryLog   from './pages/staff/InventoryLog';
import DonationMap    from './pages/charity/DonationMap';
import Impact         from './pages/charity/Impact';
import Claims         from './pages/charity/Claims';
import AdminOverview  from './pages/admin/AdminOverview';
import Donations      from './pages/manager/Donations';

const HOME = {
  manager:             '/dashboard',
  staff:               '/inventory',
  charity_coordinator: '/map',
  admin:               '/admin'
};

// Wraps a page — redirects to login if not authenticated, checks role
function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Loading..." />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME[user.role] || '/login'} replace />;
  }
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Starting FoodLoop..." />;

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user
          ? <Navigate to={HOME[user.role] || '/dashboard'} replace />
          : <Login />}
      />

      {/* Manager */}
      <Route path="/dashboard" element={
        <Protected roles={['manager', 'admin']}><Dashboard /></Protected>
      } />
      <Route path="/analytics" element={
        <Protected roles={['manager', 'admin']}><Analytics /></Protected>
      } />
      <Route path="/products" element={
        <Protected roles={['manager', 'admin']}><Products /></Protected>
      } />
      <Route path="/donations" element={
        <Protected roles={['manager', 'admin']}><Donations /></Protected>
      } />

      {/* Staff + manager */}
      <Route path="/inventory" element={
        <Protected roles={['staff', 'manager', 'admin']}><InventoryLog /></Protected>
      } />

      {/* Charity */}
      <Route path="/map" element={
        <Protected roles={['charity_coordinator', 'admin']}><DonationMap /></Protected>
      } />
      <Route path="/claims" element={
        <Protected roles={['charity_coordinator', 'admin']}><Claims /></Protected>
      } />
      <Route path="/impact" element={
        <Protected roles={['charity_coordinator', 'admin']}><Impact /></Protected>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <Protected roles={['admin']}><AdminOverview /></Protected>
      } />

      {/* Catch-all redirect */}
      <Route path="*" element={
        user
          ? <Navigate to={HOME[user.role] || '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, style: { fontSize: '14px', borderRadius: '10px' } }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
