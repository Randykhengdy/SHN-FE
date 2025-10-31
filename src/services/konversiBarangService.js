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
    changeStatusToPotongan: async (id) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}`, {
            method: 'PATCH',
        })
    },
}