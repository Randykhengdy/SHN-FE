import { request } from "@/lib/request";

const BASE = "/report-sales-order";

export const reportSalesService = {
  // ── Report Piutang Pelanggan ──────────────────────────────────────────────
  // GET /api/report-sales-order/report-piutang-pelanggan
  getPiutangPelanggan: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.start_date) q.append("start_date", params.start_date);
    if (params.end_date)   q.append("end_date",   params.end_date);
    const qs = q.toString();
    return await request(`${BASE}/report-piutang-pelanggan${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Penjualan Gudang (per tanggal) ─────────────────────────────────
  // GET /api/report-sales-order/report-penjualan-gudang
  getPenjualanGudang: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.tanggal_invoice_start) q.append("tanggal_invoice_start", params.tanggal_invoice_start);
    if (params.tanggal_invoice_end)   q.append("tanggal_invoice_end",   params.tanggal_invoice_end);
    const qs = q.toString();
    return await request(`${BASE}/report-penjualan-gudang${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Penjualan Gudang per Barang ───────────────────────────────────
  // GET /api/report-sales-order/report-penjualan-gudang-barang
  getPenjualanGudangBarang: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.tanggal_invoice_start) q.append("tanggal_invoice_start", params.tanggal_invoice_start);
    if (params.tanggal_invoice_end)   q.append("tanggal_invoice_end",   params.tanggal_invoice_end);
    const qs = q.toString();
    return await request(`${BASE}/report-penjualan-gudang-barang${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Penjualan Pelanggan per Barang ─────────────────────────────────
  // GET /api/report-sales-order/report-penjualan-pelanggan-barang
  getPenjualanPelangganBarang: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.tanggal_invoice_start) q.append("tanggal_invoice_start", params.tanggal_invoice_start);
    if (params.tanggal_invoice_end)   q.append("tanggal_invoice_end",   params.tanggal_invoice_end);
    const qs = q.toString();
    return await request(`${BASE}/report-penjualan-pelanggan-barang${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Penjualan Barang Global ────────────────────────────────────────
  // GET /api/report-sales-order/report-penjualan-barang-global
  getPenjualanBarangGlobal: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.tanggal_invoice_start) q.append("tanggal_invoice_start", params.tanggal_invoice_start);
    if (params.tanggal_invoice_end)   q.append("tanggal_invoice_end",   params.tanggal_invoice_end);
    const qs = q.toString();
    return await request(`${BASE}/report-penjualan-barang-global${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Pembayaran Uang Muka & Piutang ─────────────────────────────────
  // GET /api/report-sales-order/report-pembayaran-uang-muka-piutang
  getPembayaranUangMukaPiutang: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.start_date) q.append("start_date", params.start_date);
    if (params.end_date)   q.append("end_date",   params.end_date);
    const qs = q.toString();
    return await request(`${BASE}/report-pembayaran-uang-muka-piutang${qs ? `?${qs}` : ""}`, { method: "GET" });
  },

  // ── Report Realisasi Work Order / Tanggal ─────────────────────────────────
  // GET /api/report-sales-order/report-realisasi-wo
  getRealisasiWO: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.tanggal_start) q.append("tanggal_start", params.tanggal_start);
    if (params.tanggal_end)   q.append("tanggal_end",   params.tanggal_end);
    if (params.id_pelanggan)  q.append("id_pelanggan",  params.id_pelanggan);
    if (params.id_gudang)     q.append("id_gudang",     params.id_gudang);
    const qs = q.toString();
    return await request(`${BASE}/report-realisasi-wo${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
};
