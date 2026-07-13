import { apiClient } from '../lib/apiClient.js';

export const categoryService = {
  getCategories: (catalogId) => apiClient('/api/categories?catalog_id=' + catalogId),
  createCategory: (data) =>
    apiClient('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) =>
    apiClient('/api/categories/' + id, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiClient('/api/categories/' + id, { method: 'DELETE' }),
};
