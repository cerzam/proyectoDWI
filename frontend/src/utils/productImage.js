export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%25" height="100%25" fill="%23E1F5EE"/><text x="50%25" y="50%25" font-family="sans-serif" font-size="20" fill="%230F6E56" text-anchor="middle" dominant-baseline="middle">Sin imagen</text></svg>';

/**
 * Devuelve el arreglo de imágenes activas de un producto, imagen principal primero.
 * Usa product.images si el backend ya lo provee; si no, cae a product.image_url.
 */
export function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images;
  }
  if (product?.image_url) {
    return [product.image_url];
  }
  return [];
}
