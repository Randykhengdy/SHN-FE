import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const salesOrderService = {
  // Get all sales orders with pagination and filters
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params.date_start) queryParams.append('date_start', params.date_start);
    if (params.date_end) queryParams.append('date_end', params.date_end);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order || params.order) queryParams.append('order', params.sort_order || params.order);
    
    const url = `${API_ENDPOINTS.salesOrder}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await request(url, { method: 'GET' });
  },

  // Get sales order by ID
  getById: async (id) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}`, {
      method: 'GET'
    });
  },

  // Create new sales order
  create: async (data) => {
    return await request(API_ENDPOINTS.salesOrder, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update sales order
  update: async (id, data) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete sales order (admin only)
  delete: async (id, type = 'soft') => {
    const endpoint = type === 'force' 
      ? `${API_ENDPOINTS.salesOrder}/${id}/force`
      : `${API_ENDPOINTS.salesOrder}/${id}/soft`;
    
    return await request(endpoint, {
      method: 'DELETE'
    });
  },

  // Restore soft deleted sales order (admin only)
  restore: async (id) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}/restore`, {
      method: 'PATCH'
    });
  },

  // Request delete (non-admin users)
  requestDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}/request-delete`, {
      method: 'POST',
      body: JSON.stringify({ delete_reason: reason })
    });
  },

  // Cancel delete request (non-admin users)
  cancelDeleteRequest: async (id) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}/cancel-delete-request`, {
      method: 'PATCH'
    });
  },

  // Get pending delete requests (admin only)
  getPendingDeleteRequests: async () => {
    return await request(`${API_ENDPOINTS.salesOrder}/pending-delete-requests`, {
      method: 'GET'
    });
  },

  // Approve delete request (admin only)
  approveDelete: async (id) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}/approve-delete`, {
      method: 'PATCH'
    });
  },

  // Reject delete request (admin only)
  rejectDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.salesOrder}/${id}/reject-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason })
    });
  }
};
