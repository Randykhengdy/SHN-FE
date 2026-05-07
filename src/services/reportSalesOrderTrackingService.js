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
};
