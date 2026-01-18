import { request } from "../../lib/request";

export const rakService = {
  async getAll(params = {}) {
    const qs = Object.keys(params).length ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/rak${qs}`, { method: "GET" });
  },

  async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc", filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (search) {
      params.append("filter[nama_rak]", search);
      params.append("filter[kode]", search);
    }

    if (sortBy && sortDir) {
      params.append("sort", `${sortBy},${sortDir}`);
    }

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.append(key, value);
      }
    });

    const res = await request(`/rak?${params.toString()}`, { method: "GET" });
    if (res && res.data && Array.isArray(res.data.data)) {
      return {
        data: res.data.data,
        pagination: {
          total: res.data.total,
          last_page: res.data.last_page
        }
      };
    }
    return res;
  },

  async getById(id) {
    return request(`/rak/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/rak", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  async update(id, data) {
    return request(`/rak/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  async softDelete(id) {
    return request(`/rak/${id}`, {
      method: "DELETE"
    });
  },

  async restore(id) {
    return request(`/rak/${id}/restore`, {
      method: "PATCH"
    });
  },

  async forceDelete(id) {
    return request(`/rak/${id}/force`, {
      method: "DELETE"
    });
  },

  async getAllWithTrashed() {
    return request("/rak/with-trashed/all", {
      method: "GET"
    });
  },

  async getOnlyTrashed() {
    return request("/rak/with-trashed/trashed", {
      method: "GET"
    });
  },

  async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (sortBy && sortDir) {
      params.append("sort", `${sortBy},${sortDir}`);
    }

    return request(`/rak/with-trashed/trashed?${params.toString()}`, {
      method: "GET"
    });
  }
};

