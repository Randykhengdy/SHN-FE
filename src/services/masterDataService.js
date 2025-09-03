import { 
  gudangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService,
  pelangganService
} from './master-data';
import { request } from '@/lib/request';

// Enhanced logging utility
const logError = (serviceName, error, context = {}) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    service: serviceName,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    userAgent: navigator.userAgent,
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    } : 'Not available'
  };
  
  console.error(`🚨 CRITICAL ERROR in ${serviceName}:`, errorInfo);
  
  // Send to error tracking service if available
  if (window.electronAPI?.logError) {
    window.electronAPI.logError(errorInfo);
  }
  
  return errorInfo;
};

// Helper function to safely handle API calls with retry and detailed logging
const safeApiCall = async (apiCall, serviceName, retries = 2) => {
  const startTime = Date.now();
  
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`🔄 [${serviceName}] Attempt ${i + 1}/${retries + 1} - Starting API call`);
      
      const result = await apiCall();
      
      const duration = Date.now() - startTime;
      console.log(`✅ [${serviceName}] Success - ${result.length} items loaded in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${serviceName}] Attempt ${i + 1}/${retries + 1} failed after ${duration}ms:`, error);
      
      // Log detailed error information
      logError(serviceName, error, {
        attempt: i + 1,
        maxRetries: retries,
        duration,
        timestamp: new Date().toISOString()
      });
      
      // If it's the last attempt, return empty array instead of throwing
      if (i === retries) {
        console.warn(`⚠️ [${serviceName}] All retry attempts failed, returning empty array`);
        return [];
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = 1000 * Math.pow(2, i);
      console.log(`⏳ [${serviceName}] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Memory monitoring
const checkMemoryUsage = () => {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1024 / 1024;
    const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
    const usagePercent = (used / limit) * 100;
    
    if (usagePercent > 80) {
      console.warn(`⚠️ HIGH MEMORY USAGE: ${usagePercent.toFixed(1)}% (${used.toFixed(1)}MB/${limit.toFixed(1)}MB)`);
    }
    
    return { used, limit, usagePercent };
  }
  return null;
};

// Fetch Gudang options
export const getGudangOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await gudangService.getAll();
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: `${item.nama_gudang}`,
      searchKey: `${item.nama_gudang}`
    }));
  }, 'GudangService');
};

// Fetch Jenis Barang options
export const getJenisBarangOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await jenisBarangService.getAll();
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: item.nama_jenis || item.label,
      searchKey: item.nama_jenis || item.label
    }));
  }, 'JenisBarangService');
};

// Fetch Bentuk Barang options
export const getBentukBarangOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await bentukBarangService.getAll();
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: `${item.nama_bentuk} (${item.dimensi})`,
      searchKey: item.nama_bentuk,
      dimensi: item.dimensi,
      nama: item.nama_bentuk,
      // Tambahkan id dan kode untuk modal
      id: item.id,
      kode: item.kode
    }));
  }, 'BentukBarangService');
};

// Fetch Grade Barang options
export const getGradeBarangOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await gradeBarangService.getAll();
    return response.data.map(item => ({
      value: item.id || item.kode,
      label: item.nama || item.label,
      searchKey: item.nama || item.label
    }));
  }, 'GradeBarangService');
};

// Fetch Term of Payment options from static API
export const getTermOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await request('/static/term-of-payment', { method: 'GET' });
    return response.data.map(item => ({
      value: item.kode, // Use kode as value (string)
      label: item.nama,
      searchKey: item.nama
    }));
  }, 'TermService');
};

// Fetch Satuan options from static API
export const getUnitOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await request('/static/satuan', { method: 'GET' });
    return response.data.map(item => ({
      value: item.kode, // Use kode as value (string)
      label: item.nama,
      searchKey: item.nama
    }));
  }, 'UnitService');
};

// Fetch Pelaksana options
export const getPelaksanaOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await request('/pelaksana', { method: 'GET' });
    console.log('Pelaksana response:', response); // Debug log
    return response.data.map(item => ({
      value: item.id,
      label: `${item.nama_pelaksana} (${item.jabatan})`,
      searchKey: `${item.nama_pelaksana} ${item.jabatan}`
    }));
  }, 'PelaksanaService');
};

// Fetch Pelanggan options
export const getPelangganOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await pelangganService.getAll();
    return response.data.map(item => ({
      value: item.id,
      label: `${item.nama_pelanggan} (${item.alamat})`,
      searchKey: `${item.nama_pelanggan} ${item.alamat}`
    }));
  }, 'PelangganService');
};

// Fetch Pelanggan options from sales order header
export const getPelangganFromSOHeader = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await request('/api/sales-order/header?per_page=1000', { method: 'GET' });
    
    // Extract unique pelanggan from sales order header
    const uniquePelanggan = [];
    const seenIds = new Set();
    
    response.data.forEach(so => {
      if (so.pelanggan && !seenIds.has(so.pelanggan.id)) {
        seenIds.add(so.pelanggan.id);
        uniquePelanggan.push({
          value: so.pelanggan.id.toString(),
          label: so.pelanggan.nama_pelanggan,
          searchKey: so.pelanggan.nama_pelanggan
        });
      }
    });
    
    return uniquePelanggan;
  }, 'PelangganFromSOHeaderService');
};

// Fetch Sales Order options from header endpoint
export const getSalesOrderOptions = async () => {
  checkMemoryUsage();
  return await safeApiCall(async () => {
    const response = await request('/sales-order/header?per_page=1000', { method: 'GET' });
    
    return response.data.map(so => ({
      value: so.id.toString(),
      label: `${so.nomor_so} - ${so.pelanggan?.nama_pelanggan || 'Unknown'} (${so.tanggal_so})`,
      searchKey: `${so.nomor_so} ${so.pelanggan?.nama_pelanggan || ''}`,
      // Additional data for reference
      nomor_so: so.nomor_so,
      tanggal_so: so.tanggal_so,
      pelanggan_id: so.pelanggan_id,
      pelanggan_nama: so.pelanggan?.nama_pelanggan,
      gudang_id: so.gudang_id,
      gudang_nama: so.gudang?.nama_gudang
    }));
  }, 'SalesOrderOptionsService');
};

// Gudang
export const getGudang = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  if (params.tipe_gudang) queryParams.append('tipe_gudang', params.tipe_gudang);
  
  const url = `/api/gudang?${queryParams.toString()}`;
  return request.get(url);
};

export const getGudangById = async (id) => {
  return request.get(`/api/gudang/${id}`);
};

export const createGudang = async (gudangData) => {
  return request.post('/api/gudang', gudangData);
};

export const updateGudang = async (id, gudangData) => {
  return request.put(`/api/gudang/${id}`, gudangData);
};

export const deleteGudang = async (id) => {
  return request.delete(`/api/gudang/${id}`);
};

// Pelanggan
export const getPelanggan = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/api/pelanggan?${queryParams.toString()}`;
  return request.get(url);
};

export const getPelangganById = async (id) => {
  return request.get(`/api/pelanggan/${id}`);
};

export const createPelanggan = async (pelangganData) => {
  return request.post('/api/pelanggan', pelangganData);
};

export const updatePelanggan = async (id, pelangganData) => {
  return request.put(`/api/pelanggan/${id}`, pelangganData);
};

export const deletePelanggan = async (id) => {
  return request.delete(`/api/pelanggan/${id}`);
};

// Jenis Barang
export const getJenisBarang = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/api/jenis-barang?${queryParams.toString()}`;
  return request.get(url);
};

export const getJenisBarangById = async (id) => {
  return request.get(`/api/jenis-barang/${id}`);
};

export const createJenisBarang = async (jenisBarangData) => {
  return request.post('/api/jenis-barang', jenisBarangData);
};

export const updateJenisBarang = async (id, jenisBarangData) => {
  return request.put(`/api/jenis-barang/${id}`, jenisBarangData);
};

export const deleteJenisBarang = async (id) => {
  return request.delete(`/api/jenis-barang/${id}`);
};

// Bentuk Barang
export const getBentukBarang = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/api/bentuk-barang?${queryParams.toString()}`;
  return request.get(url);
};

export const getBentukBarangById = async (id) => {
  return request.get(`/api/bentuk-barang/${id}`);
};

export const createBentukBarang = async (bentukBarangData) => {
  return request.post('/api/bentuk-barang', bentukBarangData);
};

export const updateBentukBarang = async (id, bentukBarangData) => {
  return request.put(`/api/bentuk-barang/${id}`, bentukBarangData);
};

export const deleteBentukBarang = async (id) => {
  return request.delete(`/api/bentuk-barang/${id}`);
};

// Grade Barang
export const getGradeBarang = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/api/grade-barang?${queryParams.toString()}`;
  return request.get(url);
};

export const getGradeBarangById = async (id) => {
  return request.get(`/api/grade-barang/${id}`);
};

export const createGradeBarang = async (gradeBarangData) => {
  return request.post('/api/grade-barang', gradeBarangData);
};

export const updateGradeBarang = async (id, gradeBarangData) => {
  return request.put(`/api/grade-barang/${id}`, gradeBarangData);
};

export const deleteGradeBarang = async (id) => {
  return request.delete(`/api/grade-barang/${id}`);
};

// Pelaksana
export const getPelaksana = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.search) queryParams.append('search', params.search);
  if (params.jabatan) queryParams.append('jabatan', params.jabatan);
  
  const url = `/api/pelaksana?${queryParams.toString()}`;
  return request.get(url);
};

export const getPelaksanaById = async (id) => {
  return request.get(`/api/pelaksana/${id}`);
};

export const createPelaksana = async (pelaksanaData) => {
  return request.post('/api/pelaksana', pelaksanaData);
};

export const updatePelaksana = async (id, pelaksanaData) => {
  return request.put(`/api/pelaksana/${id}`, pelaksanaData);
};

export const deletePelaksana = async (id) => {
  return request.delete(`/api/pelaksana/${id}`);
};

