import { apiClient } from '../lib/apiClient.js';

export const catalogService = {
  getCatalog: () => apiClient('/api/catalog/me'),
  createCatalog: (data) =>
    apiClient('/api/catalog', { method: 'POST', body: JSON.stringify(data) }),
  updateCatalog: (id, data) =>
    apiClient('/api/catalog/' + id, { method: 'PUT', body: JSON.stringify(data) }),
};
