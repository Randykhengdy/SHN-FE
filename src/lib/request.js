import { getAuthHeader } from "../api/GetAuthHeader";
import apiConfig from "../config/api";

export async function request(path, options = {}) {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", response.status, errorText);
    
    // Cek apakah error 401 (Unauthorized) dan token expired
    if (response.status === 401) {
      try {
        // Coba parse response sebagai JSON
        const errorJson = JSON.parse(errorText);
        
        // Jika pesan menunjukkan token expired
        if (errorJson && errorJson.message === "Token expired") {
          console.log("Token expired, redirecting to login page...");
          
          // Hapus data login dari localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("isLoggedIn");
          
          // Redirect ke halaman login
          window.location.href = "/";
          return; // Hentikan eksekusi lebih lanjut
        }
      } catch (e) {
        // Jika gagal parse JSON, lanjutkan dengan error biasa
        console.error("Error parsing error response:", e);
      }
    }
    
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
