import { request } from "@/lib/request";

export const pembayaranService = {
  // Get payment data
  getPayments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters if provided
    if (params.status_bayar) {
      queryParams.append('status_bayar', params.status_bayar);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.per_page) {
      queryParams.append('per_page', params.per_page);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/payment${queryString ? `?${queryString}` : ''}`;
    
    return await request(endpoint, {
      method: 'GET'
    });
  },

  // Process payment
  processPayment: async (nomorInvoice, paymentData) => {
    return await request('/payment/submit-payment', {
      method: 'POST',
      body: JSON.stringify({
        nomor_invoice: nomorInvoice,
        ...paymentData
      })
    });
  },

  // View payment details
  viewPayment: async (nomorInvoice) => {
    return await request('/pembayaran/view-payment', {
      method: 'POST',
      body: JSON.stringify({
        nomor_invoice: nomorInvoice
      })
    });
  },

  // Print payment receipt
  printPaymentReceipt: async (nomorInvoice) => {
    return await request('/pembayaran/print-receipt', {
      method: 'POST',
      body: JSON.stringify({
        nomor_invoice: nomorInvoice
      })
    });
  },

  // Get payment summary
  getPaymentSummary: async () => {
    return await request('/payment/summary', {
      method: 'GET'
    });
  },

  // Get payment detail
  getPaymentDetail: async (nomorInvoice) => {
    return await request(`/payment/payment-detail?nomor_invoice=${nomorInvoice}`, {
      method: 'GET'
    });
  }
};

