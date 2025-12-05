import { request } from "@/lib/request";
// Minimal service for WO Planning validation

export const workOrderPlanningService = {
  validateSoCoverage: async (payload) => {
    return await request(`/work-order-planning/validate-so-coverage`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
