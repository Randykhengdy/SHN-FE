import { request } from "../lib/request";

export const jenisBarangService = {
  async getAll() {
    return request("/jenis-barang", { method: "GET" });
  },

  async getById(id) {
    return request(`/jenis-barang/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/jenis-barang", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/jenis-barang/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/jenis-barang/${id}/soft`, { method: "DELETE" });
  },

  async restore(id) {
    return request(`/jenis-barang/${id}/restore`, { method: "PATCH" });
  },

  async forceDelete(id) {
    return request(`/jenis-barang/${id}/force`, { method: "DELETE" });
  },

  async getAllWithTrashed() {
    return request("/jenis-barang/with-trashed/all", { method: "GET" });
  },

  async getOnlyTrashed() {
    return request("/jenis-barang/with-trashed/trashed", { method: "GET" });
  }
};
