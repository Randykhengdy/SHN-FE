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

  // Generate and get payment receipt for printing
  generatePaymentReceipt: async (paymentId) => {
    return await request('/payment/generate-receipt', {
      method: 'POST',
      body: JSON.stringify({
        payment_id: paymentId
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
  },

  // ========== Purchase Order Payment Methods ==========
  
  // Get purchase orders for payment
  getPurchaseOrderPayments: async (params = {}) => {
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
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/purchase-order${queryString ? `?${queryString}` : ''}`;
    
    return await request(endpoint, {
      method: 'GET'
    });
  },

  // Process purchase order payment
  processPurchaseOrderPayment: async (nomorPo, paymentData) => {
    return await request('/payment/submit-purchase-order-payment', {
      method: 'POST',
      body: JSON.stringify({
        nomor_po: nomorPo,
        ...paymentData
      })
    });
  },

  // Get purchase order payment detail
  getPurchaseOrderPaymentDetail: async (params) => {
    const queryParams = new URLSearchParams();
    
    if (params.purchase_order_id) {
      queryParams.append('purchase_order_id', params.purchase_order_id);
    }
    if (params.nomor_po) {
      queryParams.append('nomor_po', params.nomor_po);
    }
    
    const queryString = queryParams.toString();
    if (!queryString) {
      throw new Error('Purchase Order ID atau nomor PO harus disertakan');
    }
    
    return await request(`/payment/purchase-order-payment-detail?${queryString}`, {
      method: 'GET'
    });
  },

  // Get financial report
  getFinancialReport: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.date_from) {
      queryParams.append('date_from', params.date_from);
    }
    if (params.date_to) {
      queryParams.append('date_to', params.date_to);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.page) {
      queryParams.append('page', params.page);
    }
    if (params.per_page) {
      queryParams.append('per_page', params.per_page);
    }
    
    const queryString = queryParams.toString();
    const endpoint = `/payment/financial-report${queryString ? `?${queryString}` : ''}`;
    
    return await request(endpoint, {
      method: 'GET'
    });
  }
};

