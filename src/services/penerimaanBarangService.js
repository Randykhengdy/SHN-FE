import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export const penerimaanBarangService = {
    // Get all pending (unprocessed) Non-PO details
    getPendingNonPoItems: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.penerimaanBarang}/pending-nonpo?${queryString}`, {
            method: 'GET'
        });
    },

    // Process a non-PO detail (create ItemBarang with harga_modal + berat)
    processNonPoItem: async (detailId, data) => {
        return await request(`${API_ENDPOINTS.penerimaanBarang}/process-nonpo/${detailId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    // Get all processed Non-PO details for the 'Sudah Diinput' tab
    getProcessedNonPoItems: async (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return await request(`${API_ENDPOINTS.penerimaanBarang}/processed-nonpo?${queryString}`, {
            method: 'GET'
        });
    }
};
