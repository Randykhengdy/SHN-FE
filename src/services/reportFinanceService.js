import { request } from '@/lib/request';

export const reportFinanceService = {
  // Get Report Pemakaian Kas / Tanggal / Jenis Biaya
  getReportPemakaianKasTanggalJenisBiaya: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-finance/report-pemakaian-kas-tanggal-jenis-biaya${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  }
};
