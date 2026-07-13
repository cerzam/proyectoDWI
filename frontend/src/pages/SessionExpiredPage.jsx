import { useNavigate } from 'react-router-dom';

export default function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          !
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold text-brand-900">
          Tu sesión ha expirado
        </h1>
        <p className="mt-3 text-gray-600">
          Por seguridad, tu sesión fue cerrada automáticamente.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-6 w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-900"
        >
          Volver a iniciar sesión
        </button>
      </div>
    </div>
  );
}
