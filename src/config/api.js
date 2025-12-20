// Konfigurasi URL API berdasarkan environment
//  const DEV_API_URL = "localhost:8000";
//  const PROD_API_URL = "localhost:8000";
const DEV_API_URL = "https://shn.divineproject.my.id/api";
const PROD_API_URL = "https://shn.divineproject.my.id/api";
 
// Gunakan environment variable dari Vite jika tersedia
const API_URL = import.meta.env.VITE_API_URL || 
               (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL);

export default {
  baseUrl: API_URL,
  endpoints: {
    login: "/auth/login",
    register: "/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    jenisBarang: "/jenis-barang",
    // Tambahkan endpoint lain di sini
  }
};

export const API_ENDPOINTS = {
  login: "/auth/login",
  register: "/register",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
  jenisBarang: "/jenis-barang",
  salesOrder: "/sales-order",
  workOrderPlanning: "/work-order-planning",
  workOrderActual: "/work-order-actual",
  purchaseOrder: "/purchase-order",
  dashboardWorkshop: "/dashboard/workshop",
  stockMutation: "/stock-mutation",
  konversiBarang: "/konversi-barang",
  splitBarang: "/split-barang",
  mergeBarang: "/merge-barang",
  itemBarangRequest: "/item-barang-request",
  purchaseOrderDashboard: "/dashboard/purchase-order",
  salesOrderDashboard: "/dashboard/sales-order",
  workOrderPlanningDashboard: "/dashboard/work-order-planning",
  workOrderActualDashboard: "/dashboard/work-order-actual",
  generalDashboard: "/dashboard/general",
};