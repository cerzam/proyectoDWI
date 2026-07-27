export function filterAndSortProducts({
  products,
  searchQuery = '',
  categoryFilter = 'all',
  sortOrder = 'recent',
}) {
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('es-MX');
  const indexedProducts = products.map((product, index) => ({ product, index }));

  const filtered = indexedProducts.filter(({ product }) => {
    const matchesSearch =
      !normalizedSearch ||
      [product.name, product.description]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase('es-MX').includes(normalizedSearch)
        );
    const matchesCategory =
      categoryFilter === 'all' || String(product.category_id || '') === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCreatedAt = (product) => {
    const timestamp = Date.parse(product.created_at || '');
    return Number.isFinite(timestamp) ? timestamp : null;
  };

  return filtered
    .sort((a, b) => {
      if (sortOrder === 'price-low') {
        return Number(a.product.price || 0) - Number(b.product.price || 0);
      }
      if (sortOrder === 'price-high') {
        return Number(b.product.price || 0) - Number(a.product.price || 0);
      }
      if (sortOrder === 'name') {
        return String(a.product.name || '').localeCompare(
          String(b.product.name || ''),
          'es-MX',
          { sensitivity: 'base' }
        );
      }

      const aCreatedAt = getCreatedAt(a.product);
      const bCreatedAt = getCreatedAt(b.product);
      if (aCreatedAt !== null && bCreatedAt !== null) {
        return sortOrder === 'oldest' ? aCreatedAt - bCreatedAt : bCreatedAt - aCreatedAt;
      }
      return a.index - b.index;
    })
    .map(({ product }) => product);
}
