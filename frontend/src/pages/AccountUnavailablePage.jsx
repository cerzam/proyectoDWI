import { Link } from 'react-router-dom';
import ActionButton from '../components/ui/ActionButton.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';

export default function AccountUnavailablePage({ type }) {
  const suspended = type === 'suspended';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60 px-4 py-8">
      <SectionCard as="section" className="w-full max-w-lg text-center shadow-lg sm:p-8" contentClassName="mt-0">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold ${
            suspended ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}
          aria-hidden="true"
        >
          !
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold text-brand-900">
          {suspended ? 'Cuenta suspendida' : 'Cuenta eliminada'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-600">
          {suspended
            ? 'Tu acceso y tu catálogo público están temporalmente deshabilitados. Contacta al administrador si necesitas revisar la suspensión.'
            : 'Esta cuenta fue eliminada de forma lógica y ya no puede acceder al panel ni publicar su catálogo.'}
        </p>
        <ActionButton
          as={Link}
          to="/login"
          variant="outline"
          className="mt-7"
        >
          Volver al inicio de sesión
        </ActionButton>
      </SectionCard>
    </main>
  );
}
