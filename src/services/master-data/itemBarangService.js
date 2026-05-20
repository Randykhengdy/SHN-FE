import { request } from "../../lib/request";

export const itemBarangService = {
  async getAll(params = {}) {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    const queryString = new URLSearchParams(filteredParams).toString();
    return request(`/item-barang?${queryString}`, { method: "GET" });
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

    return request(`/item-barang?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/item-barang/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/item-barang", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/item-barang/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/item-barang/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/item-barang/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/item-barang/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/item-barang/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/item-barang/with-trashed/trashed", {
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

    return request(`/item-barang/with-trashed/trashed?${params}`, { method: "GET" });
  },

  async getMergeable() {
    return request(`/item-barang/mergeable`, { method: "GET" });
  },

  async getSimilarType(id) {
    return request(`/item-barang/similar-type/${id}`, { method: "GET" });
  },
  async getItemUtuh() {
    return request(`/item-barang/bulk`, { method: "GET" });
  },
  async updateQrCodeStatus(id, is_qrcode_printed) {
    return request(`/item-barang/${id}/qrcode-status`, {
      method: "PATCH",
      body: JSON.stringify({ is_qrcode_printed }),
    });
  },

  async downloadTemplate() {
    const { getAuthHeader } = await import("../../api/GetAuthHeader");
    const apiConfig = (await import("../../config/api")).default;

    let base = apiConfig.baseUrl || '';
    if (!/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }
    const url = `${base}/item-barang/download-template`;

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
    a.download = "Template_ItemBarang.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async importData(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/item-barang/import", { method: "POST", body: formData });
  },

  // Rongsok Approval
  async requestRongsok(itemBarangId, reason = "") {
    return request("/item-barang/destroy", {
      method: "POST",
      body: JSON.stringify({ item_barang_id: itemBarangId, reason }),
    });
  },

  async getPendingRongsok(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return request(`/item-barang/pending-rongsok?${queryString}`, { method: "GET" });
  },

  async approveRongsok(rongsokRequestId) {
    return request(`/item-barang/${rongsokRequestId}/approve-rongsok`, {
      method: "PATCH",
    });
  },

  async rejectRongsok(rongsokRequestId, rejectionReason) {
    return request(`/item-barang/${rongsokRequestId}/reject-rongsok`, {
      method: "PATCH",
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
  }
};
