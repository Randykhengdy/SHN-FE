import { request } from "@/lib/request";

const BASE_URL = "/api/unit";

class UnitService {
  async getAll() {
    return request.get(BASE_URL);
  }

  async getById(id) {
    return request.get(`${BASE_URL}/${id}`);
  }

  async create(data) {
    return request.post(BASE_URL, data);
  }

  async update(id, data) {
    return request.put(`${BASE_URL}/${id}`, data);
  }

  async delete(id) {
    return request.delete(`${BASE_URL}/${id}`);
  }

  async getPaginated(page = 1, perPage = 10, search = "", sortBy = "id", sortDir = "asc") {
    const params = {
      page,
      per_page: perPage,
      search,
      sort_by: sortBy,
      sort_dir: sortDir
    };
    return request.get(BASE_URL, { params });
  }

  async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "id", sortDir = "asc") {
    const params = {
      page,
      per_page: perPage,
      search,
      sort_by: sortBy,
      sort_dir: sortDir
    };
    return request.get(`${BASE_URL}/with-trashed/trashed`, { params });
  }

  async restore(id) {
    return request.patch(`${BASE_URL}/${id}/restore`);
  }

  async forceDelete(id) {
    return request.delete(`${BASE_URL}/${id}/force`);
  }
}

export default new UnitService();
