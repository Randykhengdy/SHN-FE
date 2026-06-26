import { request } from "@/lib/request";

export const reportMutasiService = {
  /**
   * GET /api/report-mutasi/mutasi-antar-gudang
   * Laporan Mutasi Antar Gudang / Tanggal
   */
  getMutasiAntarGudang: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date)       queryParams.append('start_date',       params.start_date);
    if (params.end_date)         queryParams.append('end_date',         params.end_date);
    if (params.gudang_asal_id)   queryParams.append('gudang_asal_id',   params.gudang_asal_id);
    if (params.gudang_tujuan_id) queryParams.append('gudang_tujuan_id', params.gudang_tujuan_id);
    if (params.status)           queryParams.append('status',           params.status);
    const qs = queryParams.toString();
    return await request(`/report-mutasi/mutasi-antar-gudang${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-mutasi/rubah-status-barang
   * Laporan Rubah Status Barang (Utuh ke Potongan) / Tanggal
   */
  getRubahStatusBarang: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date)      queryParams.append('start_date',      params.start_date);
    if (params.end_date)        queryParams.append('end_date',        params.end_date);
    if (params.gudang_tujuan_id) queryParams.append('gudang_tujuan_id', params.gudang_tujuan_id);
    const qs = queryParams.toString();
    return await request(`/report-mutasi/rubah-status-barang${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-mutasi/barang-rongsok
   * Laporan Barang Rongsok / Tanggal
   */
  getReportBarangRongsok: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date',   params.end_date);
    if (params.gudang_id)  queryParams.append('gudang_id',  params.gudang_id);
    const qs = queryParams.toString();
    return await request(`/report-mutasi/barang-rongsok${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-mutasi/barang-habis
   * Laporan Barang Habis / Tanggal
   */
  getReportBarangHabis: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date',   params.end_date);
    if (params.gudang_id)  queryParams.append('gudang_id',  params.gudang_id);
    const qs = queryParams.toString();
    return await request(`/report-mutasi/barang-habis${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-split-barang
   * Laporan Split Barang / Tanggal
   */
  getReportSplitBarang: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date',   params.end_date);
    const qs = queryParams.toString();
    return await request(`/report-split-barang${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};
