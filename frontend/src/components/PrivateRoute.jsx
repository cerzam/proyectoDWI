import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function PrivateRoute() {
  const { session, account, initialLoading, profileError } = useAuth();

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!account && profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            No pudimos validar tu cuenta
          </h1>
          <p className="mt-3 text-gray-600">{profileError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!account) return <Navigate to="/login" replace />;

  return <Outlet />;
}
