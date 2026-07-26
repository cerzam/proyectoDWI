import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';

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
    <div className="min-h-screen bg-brand-50/40">
      <header className="bg-brand-600 py-10 text-center text-white">
        <h1 className="font-serif text-4xl font-bold">{catalog.name}</h1>
        {catalog.description && (
          <p className="mx-auto mt-2 max-w-xl px-4 text-brand-50/90">{catalog.description}</p>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  activeCategory === c.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <p className="py-12 text-center text-gray-500">No hay productos en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => (
              <ProductCard key={p.id} product={p} publicView whatsapp={catalog.whatsapp} slug={slug} />
            ))}
          </div>
        )}

        {products.length === 0 && (
          <p className="py-12 text-center text-gray-500">Este catálogo aún no tiene productos.</p>
        )}
      </main>
    </div>
  );
}
