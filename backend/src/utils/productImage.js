function validImageUrl(value) {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * Resuelve la portada sin persistir datos duplicados en products.
 * La primera URL de images es la principal; image_url conserva compatibilidad.
 */
export function getPrimaryProductImage(product) {
  const declaredPrimary = validImageUrl(product?.primary_image_url);
  if (declaredPrimary) return declaredPrimary;

  const firstImage = Array.isArray(product?.images)
    ? product.images.map(validImageUrl).find(Boolean)
    : null;

  return firstImage || validImageUrl(product?.image_url);
}

export function withPrimaryProductImage(product) {
  if (!product) return product;
  return {
    ...product,
    primary_image_url: getPrimaryProductImage(product),
  };
}

export function withPrimaryProductImages(products = []) {
  return products.map(withPrimaryProductImage);
}
