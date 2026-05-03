import { request } from "@/lib/request";

export const reportStockService = {
  /**
   * GET /api/report-stock/stock-barang
   * Laporan Stock / Gudang / Barang dengan backward calculation
   */
  getStockGudangBarang: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    return await request(`/report-stock/stock-barang${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-stock/stock-barang-gudang
   * Laporan Stock / Barang / Gudang — grouped by barang, lalu gudang
   */
  getStockBarangGudang: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    return await request(`/report-stock/stock-barang-gudang${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-stock/stock-global
   * Laporan Stock Barang Global / Semua Gudang — flat list per item (semua gudang di-aggregate)
   */
  getStockGlobal: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    return await request(`/report-stock/stock-global${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
};
