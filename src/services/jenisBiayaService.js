import { request } from "@/lib/request";

export const jenisBiayaService = {
  async getAll() {
    return request("/jenis-biaya", { method: "GET" });
  },

  async getById(id) {
    return request(`/jenis-biaya/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/jenis-biaya", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/jenis-biaya/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/jenis-biaya/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/jenis-biaya/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/jenis-biaya/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/jenis-biaya/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/jenis-biaya/with-trashed/trashed", {
      method: "GET",
    });
  },
};
