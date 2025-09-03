import { request } from '@/lib/request';
import { API_ENDPOINTS } from '@/config/api';

const BASE_URL = API_ENDPOINTS.workOrderPlanning;

export const workOrderService = {
  // Get all work orders with pagination and filters
  getWorkOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.gudang_id) queryParams.append('gudang_id', params.gudang_id);
    if (params.pelanggan_id) queryParams.append('pelanggan_id', params.pelanggan_id);
    
    const url = `${BASE_URL}?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Get work order by ID
  getWorkOrderById: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'GET' });
  },

  // Create new work order
  createWorkOrder: async (workOrderData) => {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(workOrderData)
    });
  },

  // Update work order
  updateWorkOrder: async (id, workOrderData) => {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workOrderData)
    });
  },

  // Delete work order
  deleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
  },

  // Request delete work order
  requestDeleteWorkOrder: async (id, deleteReason) => {
    return request(`${BASE_URL}/${id}/request-delete`, {
      method: 'POST',
      body: JSON.stringify({ delete_reason: deleteReason })
    });
  },

  // Cancel delete request
  cancelDeleteRequest: async (id) => {
    return request(`${BASE_URL}/${id}/cancel-delete-request`, { method: 'PATCH' });
  },

  // Get pending delete requests (admin only)
  getPendingDeleteRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.delete_requested_from) queryParams.append('delete_requested_from', params.delete_requested_from);
    if (params.delete_requested_to) queryParams.append('delete_requested_to', params.delete_requested_to);
    
    const url = `${BASE_URL}/pending-delete-requests?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Approve delete request (admin only)
  approveDeleteRequest: async (id) => {
    return request(`${BASE_URL}/${id}/approve-delete`, { method: 'PATCH' });
  },

  // Reject delete request (admin only)
  rejectDeleteRequest: async (id, rejectionReason) => {
    return request(`${BASE_URL}/${id}/reject-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
  },

  // Soft delete work order (admin only)
  softDeleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/soft`, { method: 'DELETE' });
  },

  // Restore soft deleted work order (admin only)
  restoreWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/restore`, { method: 'PATCH' });
  },

  // Force delete work order (admin only)
  forceDeleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/force`, { method: 'DELETE' });
  }
};
