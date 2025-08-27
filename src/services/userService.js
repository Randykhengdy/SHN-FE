import { request } from "../lib/request";

export const userService = {
  async getAll() {
    return request("/users", { method: "GET" });
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
    
    return request(`/users?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/users/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/users/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/users/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/users/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/users-with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/users-with-trashed/trashed", {
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
    
    return request(`/users-with-trashed/trashed?${params}`, { method: "GET" });
  },


};
