import { request } from "../../lib/request";

export const pelangganService = {
  async getAll() {
    return request("/api/pelanggan", { method: "GET" });
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

    return request(`/api/pelanggan?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/api/pelanggan/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/api/pelanggan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async createWithoutValidation(data) {
    return request("/api/pelanggan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/api/pelanggan/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/api/pelanggan/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/api/pelanggan/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/api/pelanggan/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/api/pelanggan/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/api/pelanggan/with-trashed/trashed", {
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

    return request(`/api/pelanggan/with-trashed/trashed?${params}`, { method: "GET" });
  },

  async downloadTemplate() {
    const { getAuthHeader } = await import("../../api/GetAuthHeader");
    const apiConfig = (await import("../../config/api")).default;

    let base = apiConfig.baseUrl || '';
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
    const url = `${base}/pelanggan/download-template`;

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
    a.download = "Template_Pelanggan.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async importData(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/pelanggan/import", {
      method: "POST",
      body: formData,
    });
  }
};
