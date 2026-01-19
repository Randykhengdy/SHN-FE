import { request } from '@/lib/request';

export const documentSequenceService = {
  /**
   * Generate sequence number for Work Order
   * @returns {Promise<string>} Generated WO number
   */
  generateWONumber: async () => {
    try {
      const response = await request('/document-sequence/generate-sequence/wo', {
        method: 'GET'
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate WO number');
      }
    } catch (error) {
      console.error('Error generating WO number:', error);
      throw error;
    }
  },

  /**
   * Generate sequence number for Sales Order
   * @returns {Promise<string>} Generated SO number
   */
  generateSONumber: async () => {
    try {
      const response = await request('/document-sequence/generate-sequence/so', {
        method: 'GET'
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate SO number');
      }
    } catch (error) {
      console.error('Error generating SO number:', error);
      throw error;
    }
  },

  /**
   * Generate sequence number for Purchase Order
   * @returns {Promise<string>} Generated PO number
   */
  generatePONumber: async () => {
    try {
      const response = await request('/document-sequence/generate-sequence/po', {
        method: 'GET'
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate PO number');
      }
    } catch (error) {
      console.error('Error generating PO number:', error);
      throw error;
    }
  },

  /**
   * Generate sequence number for Stock Mutation
   * @returns {Promise<string>} Generated Mutasi number
   */
  generateMutasiNumber: async () => {
    try {
      const response = await request('/document-sequence/generate-sequence/mutasi', {
        method: 'GET'
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to generate Mutasi number');
      }
    } catch (error) {
      console.error('Error generating Mutasi number:', error);
      throw error;
    }
  }
};
