import { request } from "@/lib/request";

export const reportKasService = {
  /**
   * GET /api/report-kas/rincian-keuangan
   * Laporan Rincian Keuangan dan Laba Operasional per Tanggal
   */
  getRincianKeuangan: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date',   params.end_date);
    const qs = queryParams.toString();
    return await request(`/report-kas/rincian-keuangan${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /**
   * GET /api/report-kas/rekap-laba-operasional
   * Rekap Laba Operasional & Keuangan (bulanan/range)
   */
  getRekapLabaOperasional: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date)   queryParams.append('end_date',   params.end_date);
    const qs = queryParams.toString();
    return await request(`/report-kas/rekap-laba-operasional${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};
