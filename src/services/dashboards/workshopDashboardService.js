import { request } from "../../lib/request";

export const workshopDashboardService = {
  async getDashboardData(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    
    const queryString = queryParams.toString();
    const url = `/dashboard/workshop${queryString ? `?${queryString}` : ''}`;
    
    return request(url, { method: "GET" });
  }
};
