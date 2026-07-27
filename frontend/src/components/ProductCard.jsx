import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPrimaryProductImage, PLACEHOLDER_IMAGE } from '../utils/productImage';
import ActionButton from './ui/ActionButton.jsx';
import StatusBadge from './ui/StatusBadge.jsx';

function formatPrice(value) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
    Number(value || 0)
  );
}

/**
 * Tarjeta de producto reutilizable.
 * Props:
 *  - product
 *  - publicView: si true, muestra botón de WhatsApp en vez de acciones de gestión.
 *  - whatsapp: número del catálogo (solo vista pública).
 *  - slug: slug del catálogo, usado para enlazar al detalle del producto (solo vista pública).
 *  - onEdit, onInventory, onToggleVisible, onDelete: acciones (modo dashboard).
 */
export default function ProductCard({
  product,
  publicView = false,
  whatsapp,
  slug,
  onEdit,
  onInventory,
  onToggleVisible,
  onDelete,
  dashboardView = 'grid',
  categoryName = 'Sin categoría',
}) {
  const soldOut = (product.stock ?? 0) <= 0;
  const primaryImageUrl = getPrimaryProductImage(product);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsMenuRef = useRef(null);

  useEffect(() => {
    if (!actionsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!actionsMenuRef.current?.contains(event.target)) setActionsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActionsOpen(false);
        actionsMenuRef.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsOpen]);

  const whatsappLink = () => {
    const text = encodeURIComponent(`Hola, me interesa ${product.name}`);
    return `https://wa.me/${whatsapp}?text=${text}`;
  };

  if (publicView) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <Link
          to={`/c/${slug}/producto/${product.id}`}
          className="relative block aspect-[4/3] overflow-hidden bg-gray-100"
        >
          <img
            src={primaryImageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
          <div className="absolute right-2 top-2">
            <StatusBadge tone={soldOut ? 'danger' : 'success'} showDot={false}>
              {soldOut ? 'Agotado' : 'Disponible'}
            </StatusBadge>
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <Link
            to={`/c/${slug}/producto/${product.id}`}
            className="rounded-sm hover:text-brand-700"
          >
            <h3 className="font-serif text-lg font-semibold leading-snug text-gray-900">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-600">
              {product.description}
            </p>
          )}
          <p className="mt-3 text-2xl font-bold text-brand-700">
            {formatPrice(product.price)}
          </p>
          <div className="min-h-2 flex-1" />
          <ActionButton
            as="a"
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            className="mt-3"
          >
            Contactar por WhatsApp
          </ActionButton>
        </div>
      </article>
    );
  }

  const bodyLayout =
    dashboardView === 'grid'
      ? 'grid grid-cols-[6.5rem_minmax(0,1fr)] md:block'
      : 'grid grid-cols-[6.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)]';
  const imageLayout =
    dashboardView === 'grid'
      ? 'aspect-square md:aspect-[4/3]'
      : 'aspect-square h-full min-h-32';

  return (
    <article className="relative flex min-w-0 flex-col overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-brand-100 hover:shadow-md">
      <div className={bodyLayout}>
        <div className={`relative overflow-hidden rounded-tl-2xl bg-gray-100 ${imageLayout} ${dashboardView === 'grid' ? 'md:rounded-tr-2xl' : 'rounded-bl-none'}`}>
          <img
            src={primaryImageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
          {dashboardView === 'grid' && (
            <div className="absolute right-2 top-2 hidden md:block">
              <StatusBadge tone={product.is_visible ? 'success' : 'neutral'} showDot={false}>
                {product.is_visible ? 'Visible' : 'Oculto'}
              </StatusBadge>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col p-3.5 md:p-4">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="min-w-0 line-clamp-2 font-serif text-base font-semibold leading-snug text-brand-900 md:text-lg">
              {product.name}
            </h3>
            <div className={dashboardView === 'grid' ? 'md:hidden' : ''}>
              <StatusBadge
                tone={product.is_visible ? 'success' : 'neutral'}
                showDot={false}
                className="shrink-0"
              >
                {product.is_visible ? 'Visible' : 'Oculto'}
              </StatusBadge>
            </div>
          </div>
          <p className="mt-1 truncate text-xs text-gray-500 md:text-sm">{categoryName}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-lg font-bold text-brand-700">{formatPrice(product.price)}</p>
            <p className="whitespace-nowrap text-xs text-gray-500 md:text-sm">
              Stock: <span className="font-semibold text-gray-800">{product.stock ?? 0}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-[1fr_1fr_3rem] border-t border-gray-100">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-bl-2xl px-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 sm:text-sm"
        >
          <ProductActionIcon name="edit" />
          Editar
        </button>
        <button
          type="button"
          onClick={onInventory}
          className="inline-flex min-h-11 items-center justify-center gap-2 border-l border-gray-100 px-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 sm:text-sm"
        >
          <ProductActionIcon name="inventory" />
          Inventario
        </button>
        <div ref={actionsMenuRef} className="relative border-l border-gray-100">
          <button
            type="button"
            onClick={() => setActionsOpen((open) => !open)}
            aria-label={`Más acciones para ${product.name}`}
            aria-haspopup="menu"
            aria-expanded={actionsOpen}
            className="flex h-full min-h-11 w-full items-center justify-center rounded-br-2xl text-gray-600 transition hover:bg-gray-50 hover:text-brand-700"
          >
            <ProductActionIcon name="more" />
          </button>
          {actionsOpen && (
            <div
              role="menu"
              aria-label={`Acciones de ${product.name}`}
              className="absolute bottom-12 right-0 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionsOpen(false);
                  onToggleVisible();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ProductActionIcon name={product.is_visible ? 'hide' : 'show'} />
                {product.is_visible ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionsOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <ProductActionIcon name="delete" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductActionIcon({ name }) {
  const paths = {
    edit: (
      <>
        <path d="m4 20 4.5-1 10-10-3.5-3.5-10 10L4 20Z" />
        <path d="m13.5 7 3.5 3.5" />
      </>
    ),
    inventory: (
      <>
        <path d="M4 7h16v13H4V7ZM3 4h18v3H3V4Z" />
        <path d="M9 11h6" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
      </>
    ),
    hide: (
      <>
        <path d="M3 3l18 18" />
        <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.4-.9" />
      </>
    ),
    show: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    delete: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
    >
      {paths[name]}
    </svg>
  );
}
