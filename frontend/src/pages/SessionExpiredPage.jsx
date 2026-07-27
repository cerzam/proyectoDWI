import { useNavigate } from 'react-router-dom';
import ActionButton from '../components/ui/ActionButton.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';

export default function SessionExpiredPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60 px-4 py-8">
      <SectionCard className="w-full max-w-md text-center shadow-lg sm:p-8" contentClassName="mt-0">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-bold text-amber-800">
          !
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold text-brand-900">
          Tu sesión ha expirado
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Por seguridad, tu sesión fue cerrada automáticamente.
        </p>
        <ActionButton
          type="button"
          onClick={() => navigate('/login')}
          fullWidth
          className="mt-6"
        >
          Volver a iniciar sesión
        </ActionButton>
      </SectionCard>
    </main>
  );
}
