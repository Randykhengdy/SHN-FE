import { request } from "@/lib/request";

export const reportSalesOrderTrackingService = {
  /**
   * GET /api/report-sales-order/report-tracking-so-wo
   * Laporan Waktu Proses SO / WO / Tanggal
   */
  getTrackingSOWO: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date)    queryParams.append('start_date', params.start_date);
    if (params.end_date)      queryParams.append('end_date', params.end_date);
    if (params.id_gudang)     queryParams.append('id_gudang', params.id_gudang);
    if (params.id_pelanggan)  queryParams.append('id_pelanggan', params.id_pelanggan);
    const queryString = queryParams.toString();
    return await request(`/report-sales-order/report-tracking-so-wo${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-sales-order/report-kegiatan-pelaksana
   * Laporan Kegiatan Pelaksana Kerja / Tanggal
   */
  getKegiatanPelaksana: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date)   queryParams.append('start_date',   params.start_date);
    if (params.end_date)     queryParams.append('end_date',     params.end_date);
    if (params.id_pelaksana) queryParams.append('id_pelaksana', params.id_pelaksana);
    if (params.id_pelanggan) queryParams.append('id_pelanggan', params.id_pelanggan);
    const queryString = queryParams.toString();
    return await request(`/report-sales-order/report-kegiatan-pelaksana${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-sales-order/report-rekap-kegiatan-pelaksana
   * Rekap agregat kegiatan pelaksana: Pelaksana → Jenis → Bentuk+Status
   */
  getRekapKegiatanPelaksana: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date)   queryParams.append('start_date',   params.start_date);
    if (params.end_date)     queryParams.append('end_date',     params.end_date);
    if (params.id_pelaksana) queryParams.append('id_pelaksana', params.id_pelaksana);
    if (params.id_pelanggan) queryParams.append('id_pelanggan', params.id_pelanggan);
    const queryString = queryParams.toString();
    return await request(`/report-sales-order/report-rekap-kegiatan-pelaksana${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },
};

