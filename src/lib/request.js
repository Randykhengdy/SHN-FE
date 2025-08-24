import { getAuthHeader } from "../api/GetAuthHeader";
import apiConfig from "../config/api";
import { checkAndRefreshToken, logoutAndRedirect } from "./tokenUtils";

export async function request(path, options = {}) {
  // Auto refresh token sebelum hit API
  const tokenValid = await checkAndRefreshToken();
  if (!tokenValid) {
    throw new Error("Token expired and refresh failed");
  }

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
    console.log("🔍 Raw error response:", errorText);
    
    // Cek apakah error 401 (Unauthorized) - handle semua kasus token expired
    if (response.status === 401) {
      console.log("🔍 401 Unauthorized - Token expired or invalid");
      logoutAndRedirect();
      throw new Error("Token expired or invalid");
    }
    
    // Coba parse error response sebagai JSON untuk mendapatkan message yang lebih spesifik
    let errorMessage = null;
    
    try {
      console.log("🔍 Trying to parse error as JSON...");
      const errorJson = JSON.parse(errorText);
      console.log("🔍 Parsed error JSON:", errorJson);
      
      // Cek berbagai kemungkinan format error message
      if (errorJson.message) {
        errorMessage = errorJson.message;
      } else if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.msg) {
        errorMessage = errorJson.msg;
      } else if (typeof errorJson === 'string') {
        errorMessage = errorJson;
      }
      
      if (errorMessage) {
        console.log("✅ Using API error message:", errorMessage);
      }
    } catch (e) {
      // Jika gagal parse JSON, gunakan error text asli
      console.error("❌ Error parsing error response:", e);
      console.log("🔍 Using fallback error message");
    }
    
    // Throw error dengan message yang sudah di-parse
    if (errorMessage) {
      throw new Error(errorMessage);
    } else {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
  }

  return response.json();
}
