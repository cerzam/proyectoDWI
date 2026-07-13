import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import SessionExpiredPage from './pages/SessionExpiredPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProductFormPage from './pages/ProductFormPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import PublicCatalogPage from './pages/PublicCatalogPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/products/new" element={<ProductFormPage />} />
        <Route path="/dashboard/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/dashboard/inventory/:productId" element={<InventoryPage />} />
      </Route>

      <Route path="/c/:slug" element={<PublicCatalogPage />} />
    </Routes>
  );
}
