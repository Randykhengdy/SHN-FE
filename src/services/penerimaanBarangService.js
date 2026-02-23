import { request } from "../lib/request";

export const penerimaanBarangService = {
    /**
     * Get pending Non-PO items (status=pending, is_nonpo_processed=0)
     */
    async getPendingNonPoItems(params = {}) {
        const queryParams = new URLSearchParams({
            status: "pending",
            is_nonpo_processed: "0",
            per_page: (params.per_page || 100).toString(),
            page: (params.page || 1).toString(),
        });

        if (params.search) {
            queryParams.append("search", params.search);
        }

        return request(`/item-barang?${queryParams}`, { method: "GET" });
    },

    /**
     * Process Non-PO item — admin sets harga_modal and berat
     * PATCH /api/penerimaan-barang/process-nonpo-item/{itemBarangId}
     */
    async processNonPoItem(itemBarangId, data) {
        return request(`/penerimaan-barang/process-nonpo-item/${itemBarangId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },
};
