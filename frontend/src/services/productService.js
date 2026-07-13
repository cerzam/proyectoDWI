import { apiClient } from '../lib/apiClient.js';

export const productService = {
  getProducts: (catalogId) => apiClient('/api/products?catalog_id=' + catalogId),
  getProduct: (id) => apiClient('/api/products/' + id),
  createProduct: (data) =>
    apiClient('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) =>
    apiClient('/api/products/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => apiClient('/api/products/' + id, { method: 'DELETE' }),
  getInventory: (productId) => apiClient('/api/inventory/' + productId),
  createMovement: (data) =>
    apiClient('/api/inventory', { method: 'POST', body: JSON.stringify(data) }),
};
