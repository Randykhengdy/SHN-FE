import { request } from '@/lib/request';
import { API_ENDPOINTS } from '@/config/api';

const BASE_URL = API_ENDPOINTS.workOrderActual;

export const woActualService = {
  // Get all WO Actual with pagination and filters
  getWOActuals: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.gudang_id) queryParams.append('gudang_id', params.gudang_id);
    if (params.pelanggan_id) queryParams.append('pelanggan_id', params.pelanggan_id);
    if (params.wo_number) queryParams.append('wo_number', params.wo_number);
    if (params.so_number) queryParams.append('so_number', params.so_number);
    if (params.period) queryParams.append('period', params.period);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const url = `${BASE_URL}?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Get WO Actual by ID
  getWOActualById: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'GET' });
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
    // If there's a file (foto_bukti), use FormData
    if (woActualData.foto_bukti && woActualData.foto_bukti instanceof File) {
      const formData = new FormData();
      
      // Add the file
      formData.append('foto_bukti', woActualData.foto_bukti);
      
      // Add other data as JSON string or individual fields
      Object.keys(woActualData).forEach(key => {
        if (key !== 'foto_bukti') {
          if (typeof woActualData[key] === 'object') {
            formData.append(key, JSON.stringify(woActualData[key]));
          } else {
            formData.append(key, woActualData[key]);
          }
        }
      });

      return request(BASE_URL, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        }
      });
    } else {
      // Regular JSON request
      return request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(woActualData)
      });
    }
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
    if (params.status) queryParams.append('status', params.status);
    
    // This endpoint should return WO Planning that can be converted to WO Actual
    const url = `${API_ENDPOINTS.workOrderPlanning}/for-actual?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  }
};