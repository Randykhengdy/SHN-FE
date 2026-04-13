import { request } from "@/lib/request";

export const financeInvoicePodService = {
  // Get eligible work orders for invoice POD
  getEligibleForInvoicePod: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add filter parameters if provided
    if (params.is_generated !== undefined) {
      queryParams.append('is_generated', params.is_generated);
    }
    if (params.is_printed_invoice !== undefined) {
      queryParams.append('is_printed_invoice', params.is_printed_invoice);
    }
    if (params.is_printed_pod !== undefined) {
      queryParams.append('is_printed_pod', params.is_printed_pod);
    }

    const queryString = queryParams.toString();
    const endpoint = `/invoice-pod/eligible-for-invoice-pod${queryString ? `?${queryString}` : ''}`;

    return await request(endpoint, {
      method: 'GET'
    });
  },

  // Generate invoice POD
  generateInvoicePod: async (nomorWo, uangMuka = 0, metodePembayaran = null) => {
    return await request('/invoice-pod/generate-invoice-pod', {
      method: 'POST',
      body: JSON.stringify({
        nomor_wo: nomorWo,
        uang_muka: uangMuka,
        metode_pembayaran: metodePembayaran
      })
    });
  },

  // Print invoice
  printInvoice: async (workOrderId) => {
    return await request(`/invoice-pod/print-invoice/${workOrderId}`, {
      method: 'POST'
    });
  },

  // Print POD (Surat Jalan) - using view-pod endpoint
  printPod: async (nomorWo) => {
    return await request('/invoice-pod/view-pod', {
      method: 'POST',
      body: JSON.stringify({
        nomor_wo: nomorWo
      })
    });
  },

  // View invoice for printing
  viewInvoice: async (nomorWo) => {
    return await request('/invoice-pod/view-invoice', {
      method: 'POST',
      body: JSON.stringify({
        nomor_wo: nomorWo
      })
    });
  },

  // Get Report Invoice Penjualan / Tanggal
  getReportInvoicePenjualanTanggal: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);
    if (params.sort) queryParams.append('sort', params.sort);
    
    const queryString = queryParams.toString();
    const endpoint = `/invoice-pod/report${queryString ? `?${queryString}` : ''}`;
    
    return await request(endpoint, {
      method: 'GET',
    });
  },

  // Get Report Penjualan / Gudang / Tanggal
  getReportPenjualanGudangTanggal: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.tanggal_invoice_start) queryParams.append('tanggal_invoice_start', params.tanggal_invoice_start);
    if (params.tanggal_invoice_end) queryParams.append('tanggal_invoice_end', params.tanggal_invoice_end);
    
    const queryString = queryParams.toString();
    const endpoint = `/invoice-pod/report-penjualan-gudang${queryString ? `?${queryString}` : ''}`;
    
    return await request(endpoint, {
      method: 'GET',
    });
  }
};
