import { request } from '@/lib/request';

const BASE_URL = '/api/work-order';

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
    return request.get(url);
  },

  // Get work order by ID
  getWorkOrderById: async (id) => {
    return request.get(`${BASE_URL}/${id}`);
  },

  // Create new work order
  createWorkOrder: async (workOrderData) => {
    return request.post(BASE_URL, workOrderData);
  },

  // Update work order
  updateWorkOrder: async (id, workOrderData) => {
    return request.put(`${BASE_URL}/${id}`, workOrderData);
  },

  // Delete work order
  deleteWorkOrder: async (id) => {
    return request.delete(`${BASE_URL}/${id}`);
  },

  // Request delete work order
  requestDeleteWorkOrder: async (id, deleteReason) => {
    return request.post(`${BASE_URL}/${id}/request-delete`, { delete_reason: deleteReason });
  },

  // Cancel delete request
  cancelDeleteRequest: async (id) => {
    return request.patch(`${BASE_URL}/${id}/cancel-delete-request`);
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
    return request.get(url);
  },

  // Approve delete request (admin only)
  approveDeleteRequest: async (id) => {
    return request.patch(`${BASE_URL}/${id}/approve-delete`);
  },

  // Reject delete request (admin only)
  rejectDeleteRequest: async (id, rejectionReason) => {
    return request.patch(`${BASE_URL}/${id}/reject-delete`, { rejection_reason: rejectionReason });
  },

  // Soft delete work order (admin only)
  softDeleteWorkOrder: async (id) => {
    return request.delete(`${BASE_URL}/${id}/soft`);
  },

  // Restore soft deleted work order (admin only)
  restoreWorkOrder: async (id) => {
    return request.patch(`${BASE_URL}/${id}/restore`);
  },

  // Force delete work order (admin only)
  forceDeleteWorkOrder: async (id) => {
    return request.delete(`${BASE_URL}/${id}/force`);
  }
};
