import { request } from "../lib/request";

export const pelaksanaService = {
  async getAll() {
    return request("/pelaksana", { method: "GET" });
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
    
    return request(`/pelaksana?${params}`, { method: "GET" });
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
    return request(`/pelaksana/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/pelaksana/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/pelaksana/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/pelaksana/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/pelaksana/with-trashed/trashed", {
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
    
    return request(`/pelaksana/with-trashed/trashed?${params}`, { method: "GET" });
  }
};
