import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const splitBarangService = {
    // Get all stock mutations
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.splitBarang}?${queryString}`, {
            method: 'GET',
            params
        });
    },
    splitBarang: async (body) => {
        return await request(`${API_ENDPOINTS.splitBarang}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        })
    },
}