import { request } from "@/lib/request";

export const itemBarangService = {
  async getAll() {
    return request("/item-barang", { method: "GET" });
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
  }
};
