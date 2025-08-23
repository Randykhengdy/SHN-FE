import { request } from "../lib/request";

export const pelangganService = {
  async getAll() {
    return request("/pelanggan", { method: "GET" });
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
    
    return request(`/pelanggan?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/pelanggan/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/pelanggan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/pelanggan/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/pelanggan/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/pelanggan/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/pelanggan/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/pelanggan/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/pelanggan/with-trashed/trashed", {
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
    
    return request(`/pelanggan/with-trashed/trashed?${params}`, { method: "GET" });
  }
};
