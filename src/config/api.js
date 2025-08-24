// Konfigurasi URL API berdasarkan environment
const DEV_API_URL = "http://localhost:8000/api";
const PROD_API_URL = "http://localhost:8000/api"; // Sementara masih pakai localhost, ganti dengan URL produksi yang sebenarnya

// Gunakan environment variable dari Vite jika tersedia
const API_URL = import.meta.env.VITE_API_URL || 
               (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL);

export default {
  baseUrl: API_URL,
  endpoints: {
    login: "/login",
    register: "/register",
    jenisBarang: "/jenis-barang",
    // Tambahkan endpoint lain di sini
  }
};