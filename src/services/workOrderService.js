import { request } from '@/lib/request';
import { API_ENDPOINTS } from '@/config/api';
import { processWorkOrderItemsWithCanvasPreviews } from '@/lib/canvasPreviewUtils';

const BASE_URL = API_ENDPOINTS.workOrderPlanning;

export const workOrderService = {
  // Get all work orders with pagination and filters
  getWorkOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.gudang_id) queryParams.append('gudang_id', params.gudang_id);
    if (params.pelanggan_id) queryParams.append('pelanggan_id', params.pelanggan_id);
    if (params.wo_number) queryParams.append('wo_number', params.wo_number);
    if (params.so_number) queryParams.append('so_number', params.so_number);
    if (params.customer) queryParams.append('customer', params.customer);
    if (params.warehouse) queryParams.append('warehouse', params.warehouse);
    if (params.period) queryParams.append('period', params.period);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    
    const url = `${BASE_URL}?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Get work order by ID
  getWorkOrderById: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'GET' });
  },

  // Create new work order
  createWorkOrder: async (workOrderData) => {
    try {
      // Process items to add canvas previews if they exist
      if (workOrderData.items && Array.isArray(workOrderData.items)) {
        workOrderData.items = await processWorkOrderItemsWithCanvasPreviews(workOrderData.items);
      }
      
      return request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(workOrderData)
      });
    } catch (error) {
      console.error('Error in createWorkOrder:', error);
      // If canvas processing fails, still proceed with the original data
      return request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(workOrderData)
      });
    }
  },

  // Update work order
  updateWorkOrder: async (id, workOrderData) => {
    try {
      // Process items to add canvas previews if they exist
      if (workOrderData.items && Array.isArray(workOrderData.items)) {
        workOrderData.items = await processWorkOrderItemsWithCanvasPreviews(workOrderData.items);
      }
      
      return request(`${BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workOrderData)
      });
    } catch (error) {
      console.error('Error in updateWorkOrder:', error);
      // If canvas processing fails, still proceed with the original data
      return request(`${BASE_URL}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workOrderData)
      });
    }
  },

  // Delete work order
  deleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
  },

  // Request delete work order
  requestDeleteWorkOrder: async (id, deleteReason) => {
    return request(`${BASE_URL}/${id}/request-delete`, {
      method: 'POST',
      body: JSON.stringify({ delete_reason: deleteReason })
    });
  },

  // Cancel delete request
  cancelDeleteRequest: async (id) => {
    return request(`${BASE_URL}/${id}/cancel-delete-request`, { method: 'PATCH' });
  },

  // Get pending delete requests (admin only)
  getPendingDeleteRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.search) queryParams.append('search', params.search);
    if (params.delete_requested_from) queryParams.append('delete_requested_from', params.delete_requested_from);
    if (params.delete_requested_to) queryParams.append('delete_requested_to', params.delete_requested_to);
    
    const url = `${BASE_URL}/pending-delete-requests?${queryParams.toString()}`;
    return request(url, { method: 'GET' });
  },

  // Approve delete request (admin only)
  approveDeleteRequest: async (id) => {
    return request(`${BASE_URL}/${id}/approve-delete`, { method: 'PATCH' });
  },

  // Reject delete request (admin only)
  rejectDeleteRequest: async (id, rejectionReason) => {
    return request(`${BASE_URL}/${id}/reject-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
  },

  // Soft delete work order (admin only)
  softDeleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/soft`, { method: 'DELETE' });
  },

  // Restore soft deleted work order (admin only)
  restoreWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/restore`, { method: 'PATCH' });
  },

  // Force delete work order (admin only)
  forceDeleteWorkOrder: async (id) => {
    return request(`${BASE_URL}/${id}/force`, { method: 'DELETE' });
  },

  // Save saran plat dasar for work order item
  saveSaranPlatDasar: async (woItemUniqueIds, itemBarangId, isSelected = false, canvasData = null, canvasImage = null) => {
    const requestData = {
      wo_planning_item_id: woItemUniqueIds, // Array of wo_item_unique_id
      item_barang_id: itemBarangId,
      is_selected: isSelected,
      canvas_data: canvasData
    };
    
    // Add canvas_image if provided
    if (canvasImage) {
      requestData.canvas_image = canvasImage;
    }
    
    console.log('🚀 API Request to saveSaranPlatDasar:', requestData);
    console.log('📷 Canvas image included:', !!canvasImage);
    
    try {
      const response = await request(`${BASE_URL}/saran-plat-dasar`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      console.log('✅ API Response from saveSaranPlatDasar:', response);
      return response;
    } catch (error) {
      console.error('❌ API Error in saveSaranPlatDasar:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Get canvas data by item barang ID
  getCanvasDataByItemBarangId: async (itemBarangId) => {
    return request(`${API_ENDPOINTS.itemBarang}/${itemBarangId}/canvas`, { method: 'GET' });
  },

  // Get all canvas images by Work Order ID
  getWorkOrderImages: async (workOrderId) => {
    return request(`${BASE_URL}/${workOrderId}/images`, { method: 'GET' });
  }
};
