import { request } from "@/lib/request";

export const pelaksanaService = {
  async getAll() {
    return request("/pelaksana", { method: "GET" });
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
    return request(`/pelaksana/${id}/soft`, { method: "DELETE" });
  },

  async restore(id) {
    return request(`/pelaksana/${id}/restore`, { method: "PATCH" });
  },

  async forceDelete(id) {
    return request(`/pelaksana/${id}/force`, { method: "DELETE" });
  },

  async getAllWithTrashed() {
    return request("/pelaksana/with-trashed/all", { method: "GET" });
  },

  async getOnlyTrashed() {
    return request("/pelaksana/with-trashed/trashed", { method: "GET" });
  },
};
