// Konfigurasi URL API berdasarkan environment
// Set VITE_ENVIRONMENT di .env: "local" atau "prod"
const API_URL_LOCAL = import.meta.env.VITE_API_URL_LOCAL || "http://localhost:8000/api";
const API_URL_PROD = import.meta.env.VITE_API_URL_PROD || "https://shn.divineproject.my.id/api";

// Pilih URL berdasarkan VITE_ENVIRONMENT
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || "local";
const API_URL = ENVIRONMENT === "prod" ? API_URL_PROD : API_URL_LOCAL;

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