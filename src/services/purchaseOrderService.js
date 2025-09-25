import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const purchaseOrderService = {
  // Get all sales orders
  getAll: async (params = {}) => {
    return await request(API_ENDPOINTS.purchaseOrder, {
      method: 'GET',
      params
    });
  },

  // Get sales order by ID
  getById: async (id) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}`, {
      method: 'GET'
    });
  },

  // Create new sales order
  create: async (data) => {
    return await request(API_ENDPOINTS.purchaseOrder, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update sales order
  update: async (id, data) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete sales order (admin only)
  delete: async (id, type = 'soft') => {
    const endpoint = type === 'force' 
      ? `${API_ENDPOINTS.purchaseOrder}/${id}/force`
      : `${API_ENDPOINTS.purchaseOrder}/${id}/soft`;
    
    return await request(endpoint, {
      method: 'DELETE'
    });
  },

  // Restore soft deleted sales order (admin only)
  restore: async (id) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}/restore`, {
      method: 'PATCH'
    });
  },

  // Request delete (non-admin users)
  requestDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}/request-delete`, {
      method: 'POST',
      body: JSON.stringify({ delete_reason: reason })
    });
  },

  // Cancel delete request (non-admin users)
  cancelDeleteRequest: async (id) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}/cancel-delete-request`, {
      method: 'PATCH'
    });
  },

  // Get pending delete requests (admin only)
  getPendingDeleteRequests: async () => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/pending-delete-requests`, {
      method: 'GET'
    });
  },

  // Approve delete request (admin only)
  approveDelete: async (id) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}/approve-delete`, {
      method: 'PATCH'
    });
  },

  // Reject delete request (admin only)
  rejectDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.purchaseOrder}/${id}/reject-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason })
    });
  }
};
