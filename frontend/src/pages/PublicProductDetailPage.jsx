import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductImageCarousel from '../components/ProductImageCarousel.jsx';
import { getProductImages } from '../utils/productImage';
import ActionButton from '../components/ui/ActionButton.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';

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
    <div className="ui-page">
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <Link
          to={`/c/${slug}`}
          className="inline-flex min-h-10 items-center rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          ← Volver al catálogo
        </Link>

        <article className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-10 lg:p-8">
          <div className="min-w-0 self-start">
            <ProductImageCarousel images={getProductImages(product)} alt={product.name} />
          </div>

          <div className="flex min-w-0 flex-col pt-6 lg:justify-center lg:pt-0">
            <StatusBadge tone={soldOut ? 'danger' : 'success'}>
              {soldOut ? 'Agotado' : 'Disponible'}
            </StatusBadge>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-4 whitespace-pre-line text-base leading-7 text-gray-600">
                {product.description}
              </p>
            )}
            <div className="mt-6 border-y border-gray-100 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Precio
              </p>
              <p className="mt-1 text-3xl font-bold text-brand-700">
                {formatPrice(product.price)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {soldOut ? 'Sin existencias por el momento' : `${product.stock ?? 0} piezas disponibles`}
              </p>
            </div>

            <ActionButton
              as="a"
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              fullWidth
              className="mt-6"
            >
              Contactar por WhatsApp
            </ActionButton>
            <p className="mt-3 text-center text-xs leading-5 text-gray-500">
              Consulta disponibilidad y detalles directamente con {catalog.name}.
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
