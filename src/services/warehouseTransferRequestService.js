import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const warehouseTransferRequestService = {
  // Get all warehouse transfer requests
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}?${queryString}`, {
      method: "GET"
    });
  },

  // Get warehouse transfer request by ID
  getById: async (id) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}`, {
      method: "GET"
    });
  },

  // Create new warehouse transfer request
  create: async (data) => {
    return await request(API_ENDPOINTS.warehouseTransferRequest, {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  // Update warehouse transfer request
  update: async (id, data) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  // Delete warehouse transfer request (admin only)
  delete: async (id, force = false) => {
    const endpoint = force 
      ? `${API_ENDPOINTS.warehouseTransferRequest}/${id}/force`
      : `${API_ENDPOINTS.warehouseTransferRequest}/${id}/soft`;
    
    return await request(endpoint, {
      method: "DELETE"
    });
  },

  // Restore soft deleted warehouse transfer request (admin only)
  restore: async (id) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/restore`, {
      method: "PATCH"
    });
  },

  // Request delete warehouse transfer request (user)
  requestDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/request-delete`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  },

  // Cancel delete request
  cancelDeleteRequest: async (id) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/cancel-delete-request`, {
      method: "POST"
    });
  },

  // Get pending delete requests (admin only)
  getPendingDeleteRequests: async () => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/pending-delete-requests`, {
      method: "GET"
    });
  },

  // Approve delete request (admin only)
  approveDelete: async (id) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/approve-delete`, {
      method: "POST"
    });
  },

  // Reject delete request (admin only)
  rejectDelete: async (id, reason) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/reject-delete`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  },

  // Approve warehouse transfer request
  approve: async (id, approvalNotes) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ approval_notes: approvalNotes })
    });
  },

  // Reject warehouse transfer request
  reject: async (id, approvalNotes) => {
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ approval_notes: approvalNotes })
    });
  },

  // Get pending requests
  getPending: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await request(`${API_ENDPOINTS.warehouseTransferRequest}/pending?${queryString}`, {
      method: "GET"
    });
  }
};