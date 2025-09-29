import { request } from "../../lib/request";

export const workshopDashboardService = {
  async getDashboardData() {
    return request("/dashboard/workshop", { method: "GET" });
  }
};
