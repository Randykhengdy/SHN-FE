import { request } from "../../lib/request";

export const pelaksanaService = {
  async getAll() {
    return request("/pelaksana", { method: "GET" });
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

    return request(`/pelaksana?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/pelaksana/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/pelaksana", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/pelaksana/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/pelaksana/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/pelaksana/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/pelaksana/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/pelaksana/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/pelaksana/with-trashed/trashed", {
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

    return request(`/pelaksana/with-trashed/trashed?${params}`, { method: "GET" });
  },

  async downloadTemplate() {
    const { getAuthHeader } = await import("../../api/GetAuthHeader");
    const apiConfig = (await import("../../config/api")).default;

    let base = apiConfig.baseUrl || '';
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
    const url = `${base}/pelaksana/download-template`;

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
    a.download = "Template_Pelaksana.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async importData(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/pelaksana/import", {
      method: "POST",
      body: formData,
    });
  }
};
