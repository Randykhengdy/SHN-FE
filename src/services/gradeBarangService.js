import { request } from "../lib/request";

export const gradeBarangService = {
  async getAll() {
    return request("/grade-barang", { method: "GET" });
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
  }
};
