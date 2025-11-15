import { request } from '@/lib/request';
import { API_ENDPOINTS } from '@/config/api';

const PURCHASE_ORDER = API_ENDPOINTS.purchaseOrderDashboard;
const SALES_ORDER = API_ENDPOINTS.salesOrderDashboard;
const WORK_ORDER_PLANNING = API_ENDPOINTS.workOrderPlanningDashboard;
const WORK_ORDER_ACTUAL = API_ENDPOINTS.workOrderActualDashboard;

export const dashboardService = {

    getPurchaseOrderDashboard: async (params = {}) => {
        const qp = new URLSearchParams();
        if (params.date_from) qp.append('date_from', params.date_from);
        if (params.date_to) qp.append('date_to', params.date_to);
        const url = `${PURCHASE_ORDER}${qp.toString() ? `?${qp.toString()}` : ''}`;
        return request(url);
    },
    getSalesOrderDashboard: async (params = {}) => {
        const qp = new URLSearchParams();
        if (params.date_from) qp.append('date_from', params.date_from);
        if (params.date_to) qp.append('date_to', params.date_to);
        const url = `${SALES_ORDER}${qp.toString() ? `?${qp.toString()}` : ''}`;
        return request(url);
    },
    getWorkOrderPlanningDashboard: async (params = {}) => {
        const qp = new URLSearchParams();
        if (params.date_from) qp.append('date_from', params.date_from);
        if (params.date_to) qp.append('date_to', params.date_to);
        const url = `${WORK_ORDER_PLANNING}${qp.toString() ? `?${qp.toString()}` : ''}`;
        return request(url);
    },
    getWorkOrderActualDashboard: async (params = {}) => {
        const qp = new URLSearchParams();
        if (params.date_from) qp.append('date_from', params.date_from);
        if (params.date_to) qp.append('date_to', params.date_to);
        const url = `${WORK_ORDER_ACTUAL}${qp.toString() ? `?${qp.toString()}` : ''}`;
        return request(url);
    }
}