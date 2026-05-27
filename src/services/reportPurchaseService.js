import { request } from '@/lib/request';

export const reportPurchaseService = {
  // Get Report Faktur Pembelian / Tanggal
  getReportFakturPembelianTanggal: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-purchase-order/report-faktur-pembelian-tanggal${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  },

  // Get Report Pembelian / Gudang / Tanggal
  getReportPembelianGudangTanggal: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-purchase-order/report-pembelian-gudang-tanggal${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  },

  // Get Report Pembelian / Gudang / Barang
  getReportPembelianGudangBarang: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-purchase-order/report-pembelian-gudang-barang${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  },

  // Get Report Pembelian Barang Global
  getReportPembelianBarangGlobal: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-purchase-order/report-pembelian-barang-global${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  },

  // Get Report Invoice Hutang / Supplier
  getReportInvoiceHutangSupplier: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);

    const queryString = queryParams.toString();
    const endpoint = `/report-purchase-order/report-invoice-hutang-supplier${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET',
    });
  }
};
