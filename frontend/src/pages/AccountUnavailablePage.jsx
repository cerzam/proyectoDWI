import { Link } from 'react-router-dom';

export default function AccountUnavailablePage({ type }) {
  const suspended = type === 'suspended';

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${
            suspended ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}
          aria-hidden="true"
        >
          !
        </div>
        <h1 className="mt-5 font-serif text-3xl font-bold text-brand-900">
          {suspended ? 'Cuenta suspendida' : 'Cuenta eliminada'}
        </h1>
        <p className="mt-3 text-gray-600">
          {suspended
            ? 'Tu acceso y tu catálogo público están temporalmente deshabilitados. Contacta al administrador si necesitas revisar la suspensión.'
            : 'Esta cuenta fue eliminada de forma lógica y ya no puede acceder al panel ni publicar su catálogo.'}
        </p>
        <Link
          to="/login"
          className="mt-7 inline-flex rounded-lg border border-brand-400 px-5 py-2.5 font-medium text-brand-700 hover:bg-brand-50"
        >
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
