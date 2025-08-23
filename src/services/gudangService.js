import { request } from "../lib/request";

export const gudangService = {
  async getAll() {
    return request("/gudang", { method: "GET" });
  },

  async getById(id) {
    return request(`/gudang/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/gudang", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/gudang/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/gudang/${id}/soft`, { method: "DELETE" });
  },

  async restore(id) {
    return request(`/gudang/${id}/restore`, { method: "PATCH" });
  },

  async forceDelete(id) {
    return request(`/gudang/${id}/force`, { method: "DELETE" });
  },

  async getAllWithTrashed() {
    return request("/gudang/with-trashed/all", { method: "GET" });
  },

  async getOnlyTrashed() {
    return request("/gudang/with-trashed/trashed", { method: "GET" });
  }
};