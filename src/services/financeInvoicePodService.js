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
  generateInvoicePod: async (workOrderId) => {
    return await request(`/invoice-pod/generate/${workOrderId}`, {
      method: 'POST'
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
  }
};
