import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import ActionButton from '../components/ui/ActionButton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function PublicCatalogPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        // Llamada pública directa, SIN header Authorization ni apiClient.
        const res = await fetch(`${API_URL}/api/public/catalogs/${slug}`);
        if (!res.ok) {
          if (active) setNotFound(true);
          return;
        }
        const json = await res.json();
        if (active) setData(json);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    if (activeCategory === 'all') return data.products;
    return data.products.filter((p) => p.category_id === activeCategory);
  }, [data, activeCategory]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Catálogo no encontrado</h1>
        <p className="mt-2 text-gray-500">El catálogo que buscas no existe o no está disponible.</p>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-900"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const { catalog, categories, products } = data;

  return (
    <div className="ui-page">
      <header className="border-b border-brand-900/10 bg-gradient-to-br from-brand-600 to-brand-900 text-white">
        <div className="ui-container py-7 text-center sm:py-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-100">
            Catálogo
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
            {catalog.name}
          </h1>
          {catalog.description && (
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-brand-50/90 sm:text-base">
              {catalog.description}
            </p>
          )}
        </div>
      </header>

      <main className="ui-container py-5 sm:py-8">
        {categories.length > 0 && (
          <div
            className="-mx-4 mb-5 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-7 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
            aria-label="Filtrar por categoría"
          >
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              aria-pressed={activeCategory === 'all'}
              className={`min-h-10 shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                aria-pressed={activeCategory === c.id}
                className={`min-h-10 shrink-0 snap-start rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === c.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <EmptyState
            compact
            title="Este catálogo aún no tiene productos"
            description="Vuelve pronto para descubrir las novedades."
          />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            compact
            title="No hay productos en esta categoría"
            description="Prueba con otra categoría para seguir explorando."
            action={
              <ActionButton type="button" variant="secondary" onClick={() => setActiveCategory('all')}>
                Ver todos
              </ActionButton>
            }
          />
        ) : (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            aria-live="polite"
          >
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} publicView whatsapp={catalog.whatsapp} slug={slug} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
