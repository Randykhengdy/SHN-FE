import { request } from '@/lib/request';
import apiConfig, { API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/api/GetAuthHeader';

const BASE_URL = API_ENDPOINTS.workOrderActual;

export const woActualService = {
  // Get all WO Actual with pagination and filters
  getWOActuals: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    // Sorting support (multiple or single)
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.order) queryParams.append('order', params.order);
    // Adjusted to new compact list API: id_gudang, id_pelanggan, nomor_wo, nomor_so, date_from, date_to
    const idGudang = params.id_gudang ?? params.gudang_id ?? params.warehouse_id;
    const idPelanggan = params.id_pelanggan ?? params.pelanggan_id ?? params.customer_id;
    const nomorWo = params.nomor_wo ?? params.wo_number;
    const nomorSo = params.nomor_so ?? params.so_number;
    // Prefer new params `date_start/date_end` but accept legacy `date_from/date_to`
    const dateStart = params.date_start ?? params.date_from ?? params.tanggal_actual_start;
    const dateEnd = params.date_end ?? params.date_to ?? params.tanggal_actual_end;
    if (idGudang) queryParams.append('id_gudang', idGudang);
    if (idPelanggan) queryParams.append('id_pelanggan', idPelanggan);
    if (nomorWo) queryParams.append('nomor_wo', nomorWo);
    if (nomorSo) queryParams.append('nomor_so', nomorSo);
    if (dateStart) queryParams.append('date_start', dateStart);
    if (dateEnd) queryParams.append('date_end', dateEnd);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const url = `${BASE_URL}?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Get WO Actual by ID
  getWOActualById: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'GET' });
  },

  // Get report data
  getReport: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    
    // Include specific report filters
    if (params.tanggal_actual_start) queryParams.append('tanggal_actual_start', params.tanggal_actual_start);
    if (params.tanggal_actual_end) queryParams.append('tanggal_actual_end', params.tanggal_actual_end);
    if (params.id_pelanggan) queryParams.append('id_pelanggan', params.id_pelanggan);
    if (params.id_gudang) queryParams.append('id_gudang', params.id_gudang);
    if (params.status) queryParams.append('status', params.status);

    const url = `${BASE_URL}/report?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Create new WO Actual
  createWOActual: async (woActualData) => {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(woActualData)
    });
  },

  // Update WO Actual
  updateWOActual: async (id, woActualData) => {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(woActualData)
    });
  },

  // Save WO Actual (with file upload support)
  saveWOActual: async (woActualData) => {
    // Selalu kirim sebagai JSON (backend sudah menerima base64 untuk foto_bukti)
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(woActualData)
    });
  },

  // Delete WO Actual
  deleteWOActual: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
  },

  // Get WO Planning list for selection (when creating WO Actual)
  getWOPlanningForActual: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);

    // Filter by status=Pending as requested
    queryParams.append('status', 'Pending');

    const url = `${API_ENDPOINTS.workOrderPlanning}?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Get WO Actual header image (base64)
  getWOActualHeaderImage: async (actualId) => {
    return request(`${BASE_URL}/${actualId}/image`, { method: 'GET' });
  },

  // Get WO Actual header image as Blob (binary stream)
  getWOActualHeaderImageBlob: async (actualId, index = 0) => {
    const url = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderActual}/${actualId}/image?index=${index}&ts=${Date.now()}`;
    const resp = await fetch(url, {
      headers: { ...getAuthHeader(), Accept: 'image/*' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      let msg = `Failed to fetch header image (${resp.status})`;
      try {
        const errJson = await resp.json();
        msg = errJson?.message || msg;
      } catch (err) {
        console.error(err);
      }
      throw new Error(msg);
    }
    return resp.blob();
  },

  // Get WO Actual item image by item ID (base64)
  getWOActualItemImage: async (itemId) => {
    return request(`${BASE_URL}/item/${itemId}/image`, { method: 'GET' });
  },

  // Get WO Actual item image as Blob (binary stream)
  getWOActualItemImageBlob: async (itemId) => {
    const url = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderActual}/item/${itemId}/image?ts=${Date.now()}`;
    const resp = await fetch(url, {
      headers: { ...getAuthHeader(), Accept: 'image/*' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      let msg = `Failed to fetch item image (${resp.status})`;
      try {
        const errJson = await resp.json();
        msg = errJson?.message || msg;
      } catch (err) {
        console.error(err);
      }
      throw new Error(msg);
    }
    return resp.blob();
  },

  // Get WO Actual leftover item image as Blob (binary stream)
  getWOActualItemSisaImageBlob: async (itemId) => {
    const url = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderActual}/item/${itemId}/sisa-image?ts=${Date.now()}`;
    const resp = await fetch(url, {
      headers: { ...getAuthHeader(), Accept: 'image/*' },
      cache: 'no-store'
    });
    if (!resp.ok) {
      let msg = `Failed to fetch leftover item image (${resp.status})`;
      try {
        const errJson = await resp.json();
        msg = errJson?.message || msg;
      } catch (err) {
        console.error(err);
      }
      throw new Error(msg);
    }
    return resp.blob();
  },

  // Get all WO Actual item images under a WO Actual ID, supports search
  getWOActualItemImages: async (actualId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    const url = `${BASE_URL}/${actualId}/item-images${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request(url, { method: 'GET' });
  },

  // Return item barang ke rak
  returnToRack: async (data) => {
    return request(`${BASE_URL}/return-to-rack`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get daftar item yang belum dikembalikan ke rak
  getPendingReturns: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.work_order_actual_id) queryParams.append('work_order_actual_id', params.work_order_actual_id);
    const url = `${BASE_URL}/pending-returns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request(url, { method: 'GET' });
  },

  // Get riwayat pengembalian barang ke rak
  getReturnHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.work_order_actual_id) queryParams.append('work_order_actual_id', params.work_order_actual_id);
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    const url = `${BASE_URL}/return-history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request(url, { method: 'GET' });
  },
};
