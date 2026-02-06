import { request } from "../../lib/request";

export const tipeBarangService = {
    async getAll() {
        return request("/tipe-barang", { method: "GET" });
    },

    async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
        const params = new URLSearchParams({
            search: search || "",
            page: page.toString(),
            per_page: perPage.toString()
        });

        if (sortBy && sortDir) {
            params.append('sort', `${sortBy},${sortDir}`);
        }

        return request(`/tipe-barang?${params}`, { method: "GET" });
    },

    async getById(id) {
        return request(`/tipe-barang/${id}`, { method: "GET" });
    },

    async create(data) {
        return request("/tipe-barang", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(id, data) {
        return request(`/tipe-barang/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    async softDelete(id) {
        return request(`/tipe-barang/${id}/soft`, {
            method: "DELETE",
        });
    },

    async restore(id) {
        return request(`/tipe-barang/${id}/restore`, {
            method: "PATCH",
        });
    },

    async forceDelete(id) {
        return request(`/tipe-barang/${id}/force`, {
            method: "DELETE",
        });
    },

    async getAllWithTrashed() {
        return request("/tipe-barang/with-trashed/all", {
            method: "GET",
        });
    },

    async getOnlyTrashed() {
        return request("/tipe-barang/with-trashed/trashed", {
            method: "GET",
        });
    },

    async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
        const params = new URLSearchParams({
            search: search || "",
            page: page.toString(),
            per_page: perPage.toString()
        });

        if (sortBy && sortDir) {
            params.append('sort', `${sortBy},${sortDir}`);
        }

        return request(`/tipe-barang/with-trashed/trashed?${params}`, { method: "GET" });
    }
};
