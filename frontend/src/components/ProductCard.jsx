const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%23E1F5EE"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%230F6E56" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>';

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
 *  - onEdit, onInventory, onToggleVisible, onDelete: acciones (modo dashboard).
 */
export default function ProductCard({
  product,
  publicView = false,
  whatsapp,
  onEdit,
  onInventory,
  onToggleVisible,
  onDelete,
}) {
  const soldOut = (product.stock ?? 0) <= 0;

  const whatsappLink = () => {
    const text = encodeURIComponent(`Hola, me interesa ${product.name}`);
    return `https://wa.me/${whatsapp}?text=${text}`;
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
      <div className="relative aspect-[4/3] bg-gray-50">
        <img
          src={product.image_url || PLACEHOLDER}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER;
          }}
        />
        {publicView ? (
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
              soldOut ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-900'
            }`}
          >
            {soldOut ? 'Agotado' : 'Disponible'}
          </span>
        ) : (
          <span
            className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
              product.is_visible ? 'bg-brand-100 text-brand-900' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {product.is_visible ? 'Visible' : 'Oculto'}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-lg font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{product.description}</p>
        )}
        <p className="mt-2 text-xl font-bold text-brand-600">{formatPrice(product.price)}</p>

        {!publicView && (
          <p className="mt-1 text-sm text-gray-500">
            Stock: <span className="font-semibold text-gray-800">{product.stock ?? 0}</span>
          </p>
        )}

        <div className="mt-4 flex-1" />

        {publicView ? (
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Contactar por WhatsApp
          </a>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={onEdit}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Editar
            </button>
            <button
              onClick={onInventory}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Inventario
            </button>
            <button
              onClick={onToggleVisible}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {product.is_visible ? 'Ocultar' : 'Mostrar'}
            </button>
            <button
              onClick={onDelete}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
