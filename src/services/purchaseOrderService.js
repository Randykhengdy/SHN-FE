import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const purchaseOrderService = {
  // Get all sales orders
  getAll: async (params = {}) => {
    // Build query string manually because request() does not append params
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', params.page);
    if (params.per_page) qp.append('per_page', params.per_page);
    if (params.search) qp.append('search', params.search);
    if (params.status && params.status !== 'all') qp.append('status', params.status);
    if (params.date_start) qp.append('date_start', params.date_start);
    if (params.date_end) qp.append('date_end', params.date_end);
    // Sorting supports either sort (multiple) or sort_by + order
    if (params.sort) qp.append('sort', params.sort);
    if (params.sort_by) qp.append('sort_by', params.sort_by);
    if (params.order || params.sort_order) qp.append('order', params.order || params.sort_order);

    const url = `${API_ENDPOINTS.purchaseOrder}${qp.toString() ? `?${qp.toString()}` : ''}`;
    return await request(url, { method: 'GET' });
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
