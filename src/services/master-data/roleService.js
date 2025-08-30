import { request } from "../../lib/request";

export const roleService = {
  async getAll() {
    return request("/roles", { method: "GET" });
  },

  async getPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Handle sorting in the format: sort=nama_role,asc
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }
    
    return request(`/roles?${params}`, { method: "GET" });
  },

  async getById(id) {
    return request(`/roles/${id}`, { method: "GET" });
  },

  async create(data) {
    return request("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    return request(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async softDelete(id) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ Role service - Soft deleting role ID: ${id}`);
    }
    const response = await request(`/roles/${id}/soft`, {
      method: "DELETE",
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Role service - Soft delete response:`, response);
    }
    return response;
  },

  async restore(id) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Role service - Restoring role ID: ${id}`);
    }
    const response = await request(`/roles/${id}/restore`, {
      method: "PATCH",
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Role service - Restore response:`, response);
    }
    return response;
  },

  async forceDelete(id) {
    return request(`/roles/${id}/force`, {
      method: "DELETE",
    });
  },

  async getAllWithTrashed() {
    return request("/roles/with-trashed/all", {
      method: "GET",
    });
  },

  async getOnlyTrashed() {
    return request("/roles/with-trashed/trashed", {
      method: "GET",
    });
  },

  async getTrashedPaginated(page = 1, perPage = 10, search = "", sortBy = "", sortDir = "asc") {
    const params = new URLSearchParams({
      search: search || "",
      page: page.toString(),
      per_page: perPage.toString()
    });
    
    // Handle sorting in the format: sort=nama_role,asc
    if (sortBy && sortDir) {
      params.append('sort', `${sortBy},${sortDir}`);
    }
    
    const url = `/roles/with-trashed/trashed?${params}`;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Role service - Fetching trashed data from: ${url}`);
    }
    
    const response = await request(url, { method: "GET" });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Role service - Trashed data response:`, {
        dataLength: response.data?.length || 0,
        totalItems: response.meta?.total || response.data?.length || 0,
        url
      });
    }
    
    return response;
  },

  // Menu and Permission related methods
  async getMenuWithPermissions() {
    return request("/menu-with-permissions", { method: "GET" });
  },

  async getRoleMenuPermissions(roleId) {
    return request(`/role-menu-permission/by-role/${roleId}`, { method: "GET" });
  },

  async updateRoleMenuPermissions(roleId, mappings) {
    // First delete all existing mappings for this role
    await request(`/role-menu-permission/by-role/${roleId}`, { method: "DELETE" });
    
    // Then create new mappings
    if (mappings.length > 0) {
      return request("/role-menu-permission/bulk", {
        method: "POST",
        body: JSON.stringify({
          role_id: roleId,
          mappings: mappings
        }),
      });
    }
    
    return { success: true, message: "Permissions updated successfully" };
  }
};
