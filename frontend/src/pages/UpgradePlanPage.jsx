import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { SALES_WHATSAPP, isSalesWhatsAppValid } from '../config/sales.js';
import { catalogService } from '../services/catalogService.js';
import ActionButton from '../components/ui/ActionButton.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';

const FREE_PRODUCT_LIMIT = 10;

const SHARED_FEATURES = [
  'Catálogo público para compartir',
  'Control manual de inventario',
  'Hasta 5 imágenes por producto',
  'Contacto de clientes por WhatsApp',
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="mt-0.5 h-5 w-5 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.292a1 1 0 0 1 .004 1.416l-8 8a1 1 0 0 1-1.416 0l-4-4a1 1 0 1 1 1.416-1.416L8 12.584l7.292-7.292a1 1 0 0 1 1.412 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function FeatureList({ productText }) {
  return (
    <ul className="mt-6 space-y-3 text-sm text-gray-700">
      <li className="flex gap-3">
        <CheckIcon />
        <span className="font-medium">{productText}</span>
      </li>
      {SHARED_FEATURES.map((feature) => (
        <li key={feature} className="flex gap-3">
          <CheckIcon />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function UpgradePlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await catalogService.getCatalog();
        if (active) setCatalog(data);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const isPro = catalog?.plan === 'pro';
  const productCount = catalog?.product_count ?? 0;
  const freeLimit = catalog?.product_limit ?? FREE_PRODUCT_LIMIT;
  const hasReachedLimit = !isPro && productCount >= freeLimit;
  const planUsage = isPro
    ? 100
    : Math.min(100, Math.round((productCount / Math.max(freeLimit, 1)) * 100));
  const availableProducts = Math.max(0, freeLimit - productCount);

  const handleWhatsAppRequest = () => {
    if (!catalog || !isSalesWhatsAppValid) return;

    const publicUrl = catalog.slug ? `${window.location.origin}/c/${catalog.slug}` : null;
    const details = [
      'Hola, quiero solicitar el Plan Pro para mi catálogo.',
      '',
      catalog.name && `Catálogo: ${catalog.name}`,
      user?.email && `Correo: ${user.email}`,
      `Plan actual: ${isPro ? 'Pro' : 'Free'}`,
      `Productos actuales: ${productCount}`,
      publicUrl && `Enlace público: ${publicUrl}`,
    ].filter(Boolean);

    const message = encodeURIComponent(details.join('\n'));
    window.open(`https://wa.me/${SALES_WHATSAPP}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-live="polite">
        <span className="sr-only">Cargando información del plan</span>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <main className="min-h-screen bg-brand-50/40 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            No pudimos cargar la información de tu plan
          </h1>
          <p className="mt-3 text-gray-600">
            {error || 'Primero crea tu catálogo desde el dashboard.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
          >
            Volver al dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="ui-page">
      <header className="border-b border-gray-200 bg-white">
        <div className="ui-container flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-600">{catalog.name}</p>
            <p className="text-xs text-gray-500">Planes del catálogo</p>
          </div>
          <ActionButton
            type="button"
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Volver al dashboard
          </ActionButton>
        </div>
      </header>

      <main className="ui-container py-8 sm:py-10">
        <section className="mx-auto max-w-3xl text-center" aria-labelledby="upgrade-title">
          <div className="flex justify-center">
            <StatusBadge tone={isPro ? 'brand' : 'neutral'}>
              Plan actual: {isPro ? 'Pro' : 'Free'}
            </StatusBadge>
          </div>
          <h1
            id="upgrade-title"
            className="mt-3 font-serif text-3xl font-bold text-brand-900 sm:text-4xl"
          >
            Amplía tu catálogo con Plan Pro
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Actualmente tienes {productCount} {productCount === 1 ? 'producto registrado' : 'productos registrados'}.
            {isPro
              ? ' Tu catálogo ya puede crecer sin el límite de 10 productos del plan Free.'
              : ' Compara los planes y solicita la activación cuando necesites publicar más productos.'}
          </p>
        </section>

        <SectionCard className="mx-auto mt-7 max-w-3xl" contentClassName="mt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                Uso del plan
              </p>
              <p className="mt-1 font-serif text-xl font-bold text-brand-900">
                {isPro ? 'Plan Pro activo' : `${productCount} de ${freeLimit} productos`}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {isPro
                  ? `${productCount} productos registrados, sin el límite del plan Free.`
                  : `${availableProducts} ${availableProducts === 1 ? 'espacio disponible' : 'espacios disponibles'}.`}
              </p>
            </div>
            <StatusBadge tone={isPro ? 'brand' : hasReachedLimit ? 'warning' : 'success'}>
              {isPro ? 'Pro' : hasReachedLimit ? 'Límite alcanzado' : `${planUsage}% utilizado`}
            </StatusBadge>
          </div>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-100"
            role="progressbar"
            aria-label="Uso de productos del plan"
            aria-valuemin={0}
            aria-valuemax={isPro ? 100 : freeLimit}
            aria-valuenow={isPro ? 100 : Math.min(productCount, freeLimit)}
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${planUsage}%` }}
            />
          </div>
        </SectionCard>

        {isPro && (
          <section
            className="mx-auto mt-8 max-w-3xl rounded-xl border border-brand-100 bg-white p-5 text-center shadow-sm"
            aria-live="polite"
          >
            <p className="font-serif text-xl font-semibold text-brand-900">Tu Plan Pro ya está activo</p>
            <p className="mt-2 text-sm text-gray-600">
              No necesitas enviar una nueva solicitud. Puedes continuar administrando tu catálogo.
            </p>
          </section>
        )}

        {hasReachedLimit && (
          <section
            className="mx-auto mt-8 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900"
            aria-live="polite"
          >
            <p className="font-semibold">Has alcanzado el límite de 10 productos del plan Free.</p>
            <p className="mt-1 text-sm">
              Puedes eliminar un producto existente o solicitar el Plan Pro para registrar más.
            </p>
          </section>
        )}

        <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Comparación de planes">
          <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Plan Free</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-gray-900">Lo esencial para empezar</h2>
              </div>
              {!isPro && (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  Plan actual
                </span>
              )}
            </div>
            <div className="text-brand-600">
              <FeatureList productText="Hasta 10 productos" />
            </div>
          </article>

          <article className="relative rounded-2xl border-2 border-brand-400 bg-white p-6 shadow-md sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Plan Pro</p>
                <h2 className="mt-2 font-serif text-2xl font-bold text-brand-900">Espacio para crecer</h2>
              </div>
              {isPro && (
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                  Plan actual
                </span>
              )}
            </div>
            <div className="text-brand-600">
              <FeatureList productText="Sin el límite de 10 productos del plan Free" />
            </div>
          </article>
        </section>

        <section className="mx-auto mt-8 max-w-3xl rounded-2xl bg-brand-900 px-6 py-8 text-center text-white sm:px-10">
          {isPro ? (
            <>
              <h2 className="font-serif text-2xl font-semibold">Continúa administrando tu catálogo</h2>
              <ActionButton
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="secondary"
                className="mt-6"
              >
                Volver al dashboard
              </ActionButton>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-semibold">Solicita la activación de Plan Pro</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-brand-100">
                La activación no es automática. Enviaremos tu solicitud por WhatsApp y el equipo
                comercial validará manualmente los datos y la activación de tu cuenta.
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <ActionButton
                  type="button"
                  onClick={handleWhatsAppRequest}
                  disabled={!isSalesWhatsAppValid}
                  aria-describedby={!isSalesWhatsAppValid ? 'sales-whatsapp-help' : undefined}
                  variant="secondary"
                  size="lg"
                >
                  Solicitar por WhatsApp
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="secondary"
                  size="lg"
                  className="border-brand-100 bg-transparent text-white hover:bg-white/10"
                >
                  Volver al dashboard
                </ActionButton>
              </div>
              {!isSalesWhatsAppValid && (
                <p id="sales-whatsapp-help" className="mt-4 text-sm text-amber-200" role="status">
                  El número comercial no está configurado o tiene un formato inválido. Configura
                  VITE_SALES_WHATSAPP usando únicamente números, sin +, espacios ni guiones.
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
