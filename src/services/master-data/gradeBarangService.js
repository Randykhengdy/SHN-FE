import { request } from "../../lib/request";

export const gradeBarangService = {
  async getAll() {
    return request("/grade-barang", { method: "GET" });
  },

  async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      per_page: perPage.toString()
    });

    // Handle sorting in the format: sort=kode,asc;nama_jenis,desc
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }

    return request(`/grade-barang?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/grade-barang/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/grade-barang", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/grade-barang/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/grade-barang/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/grade-barang/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/grade-barang/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/grade-barang/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/grade-barang/with-trashed/trashed", {
      method: "GET",
    });
  },

  async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      per_page: perPage.toString()
    });

    // Handle sorting in the format: sort=kode,asc;nama_jenis,desc
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }

    return request(`/grade-barang/with-trashed/trashed?${params}`, { method: "GET" });
  },

  async downloadTemplate() {
    const { getAuthHeader } = await import("../../api/GetAuthHeader");
    const apiConfig = (await import("../../config/api")).default;

    let base = apiConfig.baseUrl || '';
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
    const url = `${base}/grade-barang/download-template`;

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
    a.download = "Template_GradeBarang.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async importData(file) {
    const formData = new FormData();
    formData.append("file", file);

    return request("/grade-barang/import", {
      method: "POST",
      body: formData,
      headers: {
        // request.js should handle Content-Type when body is FormData
      },
    });
  }
};
