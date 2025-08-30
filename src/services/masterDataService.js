import { 
  gudangService, 
  jenisBarangService, 
  bentukBarangService, 
  gradeBarangService 
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

