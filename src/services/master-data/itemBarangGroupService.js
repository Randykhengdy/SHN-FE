import { request } from "../../lib/request";

export const itemBarangGroupService = {
    async getAll(params = {}) {
        const queryParams = new URLSearchParams();

        // Add all filter parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                queryParams.append(key, params[key]);
            }
        });

        const queryString = queryParams.toString();
        return request(`/item-barang/group${queryString ? `?${queryString}` : ''}`, {
            method: "GET"
        });
    },

    async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc", filters = {}) {
        const params = new URLSearchParams({
            search: search || "",
            page: page.toString(),
            per_page: perPage.toString()
        });

        if (sortBy && sortDir) {
            params.append('sort', `${sortBy},${sortDir}`);
        }

        // Add filter parameters
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        return request(`/item-barang/group?${params}`, { method: "GET" });
    },

    async getById(id) {
        return request(`/item-barang/group/${id}`, { method: "GET" });
    },

    async create(data) {
        return request("/item-barang/group", {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    async update(id, data) {
        return request(`/item-barang/group/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    async softDelete(id) {
        return request(`/item-barang/group/${id}`, {
            method: "DELETE",
        });
    },

    async generateGroup() {
        return request("/item-barang/generate-group", {
            method: "POST",
        });
    },

    async downloadTemplate() {
        const { getAuthHeader } = await import("../../api/GetAuthHeader");
        const apiConfig = (await import("../../config/api")).default;

        let base = apiConfig.baseUrl || '';
        if (!/^https?:\/\//i.test(base)) {
            base = `http://${base}`;
        }
        const url = `${base}/item-barang/group/download-template`;

        const response = await fetch(url, {
            method: "GET",
            headers: { ...getAuthHeader() },
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = "Template_ItemBarangGroup.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    },

    async importData(file) {
        const formData = new FormData();
        formData.append("file", file);
        return request("/item-barang/group/import", { method: "POST", body: formData });
    },
};
