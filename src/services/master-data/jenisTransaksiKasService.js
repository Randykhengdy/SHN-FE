import { request } from "../../lib/request";

export const jenisTransaksiKasService = {
  async getAll() {
    return request("/jenis-transaksi-kas", { method: "GET" });
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
    
    return request(`/jenis-transaksi-kas?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/jenis-transaksi-kas/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/jenis-transaksi-kas", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/jenis-transaksi-kas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/jenis-transaksi-kas/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/jenis-transaksi-kas/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/jenis-transaksi-kas/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/jenis-transaksi-kas/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/jenis-transaksi-kas/with-trashed/trashed", {
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
    
    return request(`/jenis-transaksi-kas/with-trashed/trashed?${params}`, { method: "GET" });
  }
};
