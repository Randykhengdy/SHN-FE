import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const itemBarangRequestService = {
    // Get all item barang requests
    getAll: async (params = {}) => {
        // Filter out undefined/null values
        const filteredParams = Object.fromEntries(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
        );
        const queryString = new URLSearchParams(filteredParams).toString();
        return await request(`${API_ENDPOINTS.itemBarangRequest}?${queryString}`, {
            method: 'GET',
            params: filteredParams
        });
    },

    // Get item barang request by ID
    getById: async (id) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/${id}`, {
            method: 'GET'
        });
    },

    // Create new item barang request
    create: async (data) => {
        return await request(API_ENDPOINTS.itemBarangRequest, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Update item barang request (only own requests)
    update: async (id, data) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Delete item barang request (only own requests)
    delete: async (id) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/${id}`, {
            method: 'DELETE'
        });
    },

    // Approve item barang request (admin only)
    approve: async (id, data = {}) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/${id}/approve`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Reject item barang request (admin only)
    reject: async (id, data = {}) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/${id}/reject`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Get pending requests (admin only)
    getPendingRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.itemBarangRequest}/pending?${queryString}`, {
            method: 'GET',
            params
        });
    },

    // Get approved requests
    getApprovedRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.itemBarangRequest}/approved?${queryString}`, {
            method: 'GET',
            params
        });
    },

    // Get rejected requests
    getRejectedRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.itemBarangRequest}/rejected?${queryString}`, {
            method: 'GET',
            params
        });
    },

    // Get user's own requests
    getMyRequests: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.itemBarangRequest}/my-requests?${queryString}`, {
            method: 'GET',
            params
        });
    },

    // Assign specific item to a request detail (admin only)
    assignItem: async (detailId, itemAssignments) => {
        return await request(`${API_ENDPOINTS.itemBarangRequest}/detail/${detailId}/assign-item`, {
            method: 'PATCH',
            body: JSON.stringify({ item_assignments: itemAssignments })
        });
    }
};