import { request } from "@/lib/request";

export const jenisMutasiStockService = {
  async getAll() {
    return request("/jenis-mutasi-stock", { method: "GET" });
  },

  async getById(id) {
    return request(`/jenis-mutasi-stock/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/jenis-mutasi-stock", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/jenis-mutasi-stock/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/jenis-mutasi-stock/${id}/soft`, { method: "DELETE" });
  },

  async restore(id) {
    return request(`/jenis-mutasi-stock/${id}/restore`, { method: "PATCH" });
  },

  async forceDelete(id) {
    return request(`/jenis-mutasi-stock/${id}/force`, { method: "DELETE" });
  },

  async getAllWithTrashed() {
    return request("/jenis-mutasi-stock/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/jenis-mutasi-stock/with-trashed/trashed", {
      method: "GET",
    });
  },
};
