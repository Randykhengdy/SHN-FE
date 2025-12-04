import { request } from "../../lib/request";

export const beratJenisService = {
  async getAll() {
    return request("/berat-jenis", { method: "GET" });
  },

  async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc", filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }
    
    // Add filter parameters
    if (filters.jenis_barang_id) {
      params.append('jenis_barang_id', filters.jenis_barang_id);
    }
    if (filters.bentuk_barang_id) {
      params.append('bentuk_barang_id', filters.bentuk_barang_id);
    }
    if (filters.grade_barang_id) {
      params.append('grade_barang_id', filters.grade_barang_id);
    }
    
    const response = await request(`/berat-jenis?${params}`, { method: "GET" });
    return response;
  },

  async getById(id) {
    return request(`/berat-jenis/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/berat-jenis", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/berat-jenis/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    return request(`/berat-jenis/${id}/soft`, {
      method: "DELETE",
    });
  },

  async restore(id) {
    return request(`/berat-jenis/${id}/restore`, {
      method: "PATCH",
    });
  },

  async forceDelete(id) {
    return request(`/berat-jenis/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/berat-jenis/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/berat-jenis/with-trashed/trashed", {
      method: "GET",
    });
  },

  async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc", filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    if (search) {
      params.append('search', search);
    }
    
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }
    
    // Add filter parameters
    if (filters.jenis_barang_id) {
      params.append('jenis_barang_id', filters.jenis_barang_id);
    }
    if (filters.bentuk_barang_id) {
      params.append('bentuk_barang_id', filters.bentuk_barang_id);
    }
    if (filters.grade_barang_id) {
      params.append('grade_barang_id', filters.grade_barang_id);
    }
    
    return request(`/berat-jenis/with-trashed/trashed?${params}`, { method: "GET" });
  },

  async generateFromItemBarangGroup() {
    return request("/berat-jenis/generate-from-item-barang-group", {
      method: "POST",
    });
  },

  async calculateWeight(data) {
    return request("/berat-jenis/calculate-weight", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
};

