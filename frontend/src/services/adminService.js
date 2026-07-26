import { apiClient } from '../lib/apiClient.js';

export const adminService = {
  async listUsers() {
    const response = await apiClient('/api/admin/users');
    return response.users;
  },

  async changePlan(userId, plan) {
    const response = await apiClient(`/api/admin/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan }),
    });
    return response.user;
  },

  async changeStatus(userId, status, reason) {
    const response = await apiClient(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    });
    return response.user;
  },

  async deleteUser(userId) {
    const response = await apiClient(`/api/admin/users/${userId}`, { method: 'DELETE' });
    return response.user;
  },
};
