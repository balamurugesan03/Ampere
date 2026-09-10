import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import Coupons from './pages/Coupons';
import Users from './pages/Users';
import MLMSettingsPage from './pages/MLMSettingsPage';
import Network from './pages/Network';
import Payouts from './pages/Payouts';
import RankSettings from './pages/RankSettings';
import Banners from './pages/Banners';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090b09] text-[#8c928d]">
        Loading...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payment-settings" element={<PaymentSettingsPage />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/users" element={<Users />} />
          <Route path="/mlm-settings" element={<MLMSettingsPage />} />
          <Route path="/network" element={<Network />} />
          <Route path="/network/:userId" element={<Network />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="/ranks" element={<RankSettings />} />
          <Route path="/banners" element={<Banners />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
