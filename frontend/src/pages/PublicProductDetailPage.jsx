import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImageCarousel from '../components/ProductImageCarousel.jsx';
import { getProductImages } from '../utils/productImage';

const API_URL = import.meta.env.VITE_API_URL || '';

function formatPrice(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(value || 0)
  );
}

export default function PublicProductDetailPage() {
  const { slug, id } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        const found = json.products.find((p) => String(p.id) === String(id));
        if (!found) {
          if (active) setNotFound(true);
          return;
        }
        if (active) {
          setCatalog(json.catalog);
          setProduct(found);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Producto no encontrado</h1>
        <p className="mt-2 text-gray-500">El producto que buscas no existe o no está disponible.</p>
        <Link
          to={`/c/${slug}`}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-900"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const soldOut = (product.stock ?? 0) <= 0;
  const whatsappLink = () => {
    const text = encodeURIComponent(`Hola, me interesa ${product.name}`);
    return `https://wa.me/${catalog.whatsapp}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-brand-50/40">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to={`/c/${slug}`} className="text-sm font-medium text-brand-600 hover:text-brand-900">
          ← Volver al catálogo
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
          <ProductImageCarousel images={getProductImages(product)} alt={product.name} />

          <div className="flex flex-col">
            <span
              className={`mb-2 inline-flex w-fit rounded-full px-2 py-1 text-xs font-semibold ${
                soldOut ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-900'
              }`}
            >
              {soldOut ? 'Agotado' : 'Disponible'}
            </span>
            <h1 className="font-serif text-3xl font-bold text-gray-900">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-gray-600">{product.description}</p>
            )}
            <p className="mt-4 text-2xl font-bold text-brand-600">{formatPrice(product.price)}</p>

            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-900"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
