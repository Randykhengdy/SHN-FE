import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const konversiBarangService = {
    // Get all stock mutations
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.konversiBarang}?${queryString}`, {
            method: 'GET',
            params
        });
    },

    // Get stock mutation by ID
    getById: async (id) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}`, {
            method: 'GET'
        });
    },

    // Create new stock mutation
    create: async (data) => {
        return await request(API_ENDPOINTS.konversiBarang, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Update stock mutation
    update: async (id, data) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Delete stock mutation (admin only)
    delete: async (id, type = 'soft') => {
        const endpoint = type === 'force'
            ? `${API_ENDPOINTS.konversiBarang}/${id}/force`
            : `${API_ENDPOINTS.konversiBarang}/${id}/soft`;

        return await request(endpoint, {
            method: 'DELETE'
        });
    },

    // Restore soft deleted stock mutation (admin only)
    restore: async (id) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}/restore`, {
            method: 'PATCH'
        });
    },

    // Request delete (non-admin users)
    requestDelete: async (id, reason) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}/request-delete`, {
            method: 'POST',
            body: JSON.stringify({ delete_reason: reason })
        });
    },

    // Cancel delete request (non-admin users)
    cancelDeleteRequest: async (id) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}/cancel-delete-request`, {
            method: 'PATCH'
        });
    },

    // Get pending delete requests (admin only)
    getPendingDeleteRequests: async () => {
        return await request(`${API_ENDPOINTS.konversiBarang}/pending-delete-requests`, {
            method: 'GET'
        });
    },

    // Approve delete request (admin only)
    approveDelete: async (id) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}/approve-delete`, {
            method: 'PATCH'
        });
    },

    // Reject delete request (admin only)
    rejectDelete: async (id, reason) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}/reject-delete`, {
            method: 'PATCH',
            body: JSON.stringify({ rejection_reason: reason })
        });
    }
}