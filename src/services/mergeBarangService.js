import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const mergeBarangService = {
    // Get all stock mutations
    getAll: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.mergeBarang}?${queryString}`, {
            method: 'GET',
            params
        });
    },
    mergeBarang: async (body) => {
        return await request(`${API_ENDPOINTS.mergeBarang}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        })
    },
}