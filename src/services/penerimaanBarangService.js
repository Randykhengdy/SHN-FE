import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const penerimaanBarangService = {
    // Get all pending non-PO items (status=pending, is_nonpo_processed=0)
    getPendingNonPoItems: async (params = {}) => {
        const queryParams = {
            ...params,
            status: 'pending',
            is_nonpo_processed: 0
        };
        const queryString = new URLSearchParams(queryParams).toString();
        return await request(`${API_ENDPOINTS.itemBarang}?${queryString}`, {
            method: 'GET'
        });
    },

    // Process a non-PO item (set harga_modal, berat, and mark as processed)
    processNonPoItem: async (id, data) => {
        return await request(`${API_ENDPOINTS.penerimaanBarang}/process-nonpo-item/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
};
