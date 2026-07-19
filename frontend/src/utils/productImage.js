export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%23E1F5EE"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%230F6E56" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>';

function validImageUrl(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * Devuelve el arreglo de imágenes activas de un producto, imagen principal primero.
 * Usa product.images si el backend ya lo provee; si no, cae a product.image_url.
 */
export function getProductImages(product) {
  const images = Array.isArray(product?.images)
    ? product.images.map(validImageUrl).filter(Boolean)
    : [];

  if (images.length > 0) {
    return images;
  }

  const fallback = validImageUrl(product?.primary_image_url) || validImageUrl(product?.image_url);
  if (fallback) {
    return [fallback];
  }

  return [];
}

/** Portada para tarjetas: propiedad calculada, primera imagen y legado image_url. */
export function getPrimaryProductImage(product) {
  return (
    validImageUrl(product?.primary_image_url) ||
    getProductImages(product)[0] ||
    validImageUrl(product?.image_url)
  );
}
