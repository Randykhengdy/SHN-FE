import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const konversiBarangService = {
    // Get all stock mutations
    getAll: async (params = {}) => {
        const cleanParams = {};
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                cleanParams[key] = params[key];
            }
        });
        const queryString = new URLSearchParams(cleanParams).toString();
        return await request(`${API_ENDPOINTS.konversiBarang}?${queryString}`, {
            method: 'GET',
            params: cleanParams
        });
    },
    changeStatusToPotongan: async (id, salesOrderId) => {
        return await request(`${API_ENDPOINTS.konversiBarang}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ sales_order_id: salesOrderId })
        })
    },
}