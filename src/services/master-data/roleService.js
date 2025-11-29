import { request } from "../../lib/request";
import { getCurrentRoleId } from "../../lib/utils";

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
    const resp = await request("/menu-menu-permission?include=menu,permission", { method: "GET" });
    const rows = resp?.data || resp || [];
    const menuMap = new Map();
    rows.forEach((row) => {
      const m = row.menu || row.menus || {};
      const id = Number(m.id || row.menu_id || row.id);
      if (!id) return;
      if (!menuMap.has(id)) {
        menuMap.set(id, {
          id,
          nama_menu: m.nama_menu || m.nama || m.name || row.menu_name || `Menu ${id}`,
        });
      }
    });
    return Array.from(menuMap.values());
  },

  async getMenuPermissionMappings(perPage = 1000) {
    const resp = await request(`/menu-menu-permission?include=menu,permission&per_page=${perPage}`, { method: "GET" });
    return resp?.data || resp || [];
  },

  async getRoleMenuPermissions(roleId) {
    const resp = await request(`/role-menu-permission/grouped/by-role/${roleId}`, { method: "GET" });
    const data = resp?.data || {};
    const menus = Array.isArray(data.menus) ? data.menus : [];
    const out = [];
    menus.forEach((menu) => {
      const mId = Number(menu.menu_id ?? menu.menu?.id);
      const perms = Array.isArray(menu.permissions) ? menu.permissions : [];
      perms.forEach((perm) => {
        const pId = Number(perm.permission_id ?? perm.id ?? perm);
        if (mId && pId) {
          out.push({ menu_id: mId, permission_id: pId });
        }
      });
    });
    return out;
  },

  async getRoleMenuPermissionsData(roleId) {
    const resp = await request(`/role-menu-permission/grouped/by-role/${roleId}`, { method: "GET" });
    return resp?.data || resp || null;
  },

  async getCurrentRoleMenuPermissions() {
    const roleId = getCurrentRoleId();
    if (!roleId) return [];
    return this.getRoleMenuPermissions(roleId);
  },

  async createRoleMenuPermission(payload) {
    // payload: { role_id, menu_menu_permission_id } OR { role_id, menu_id, permission_id }
    return request(`/role-menu-permission`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateRoleMenuPermission(id, payload) {
    return request(`/role-menu-permission/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteRoleMenuPermission(id) {
    return request(`/role-menu-permission/${id}`, { method: "DELETE" });
  },

  async updateRoleMenuPermissions(roleId, desiredMappings) {
    // desiredMappings: Array<{ menu_id, permission_id }>
    const current = await this.getRoleMenuPermissions(roleId);
    const currentKeyToId = new Map();
    const currentSet = new Set();
    (current || []).forEach((row) => {
      const key = `${Number(row.menu_id)}-${Number(row.permission_id)}`;
      currentSet.add(key);
      if (row.id) currentKeyToId.set(key, row.id);
    });

    const desiredSet = new Set();
    (desiredMappings || []).forEach((m) => {
      desiredSet.add(`${Number(m.menu_id)}-${Number(m.permission_id)}`);
    });

    const toAdd = [];
    desiredSet.forEach((key) => {
      if (!currentSet.has(key)) {
        const [menuId, permId] = key.split("-").map(Number);
        toAdd.push({ role_id: roleId, menu_id: menuId, permission_id: permId });
      }
    });

    const toRemoveIds = [];
    currentSet.forEach((key) => {
      if (!desiredSet.has(key)) {
        const id = currentKeyToId.get(key);
        if (id) toRemoveIds.push(id);
      }
    });

    // Execute add and remove concurrently
    const addPromises = toAdd.map((payload) => this.createRoleMenuPermission(payload).catch(() => null));
    const removePromises = toRemoveIds.map((id) => this.deleteRoleMenuPermission(id).catch(() => null));
    await Promise.all([...addPromises, ...removePromises]);

    return { success: true };
  }
};
