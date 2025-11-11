import { request } from '@/lib/request';
import { API_ENDPOINTS } from '@/config/api';

const PURCHASE_ORDER = API_ENDPOINTS.purchaseOrderDashboard;
const SALES_ORDER = API_ENDPOINTS.salesOrderDashboard;
const WORK_ORDER_PLANNING = API_ENDPOINTS.workOrderPlanningDashboard;
const WORK_ORDER_ACTUAL = API_ENDPOINTS.workOrderActualDashboard;

export const dashboardService = {

    getPurchaseOrderDashboard: async () => {
        return request(`${PURCHASE_ORDER}`)
    },
    getSalesOrderDashboard: async () => {
        return request(`${SALES_ORDER}`)
    },
    getWorkOrderPlanningDashboard: async () => {
        return request(`${WORK_ORDER_PLANNING}`)
    },
    getWorkOrderActualDashboard: async () => {
        return request(`${WORK_ORDER_ACTUAL}`)
    }
}