import { getAuthHeader } from "../api/GetAuthHeader";
import apiConfig from "../config/api";
import { performTokenRefresh, logoutAndRedirect } from "./tokenUtils";

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
    console.log("🔍 Raw error response:", errorText);
    
    // Cek apakah error 401 (Unauthorized) - coba refresh token dulu
    if (response.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 401 Unauthorized - Attempting token refresh...");
      }
      
      // Coba refresh token dengan retry
      let refreshSuccess = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          refreshSuccess = await performTokenRefresh();
          if (refreshSuccess) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Token refreshed on attempt ${attempt}, retrying request...`);
            }
            // Retry request dengan token baru
            return request(path, options);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Token refresh attempt ${attempt} failed:`, error.message);
          }
        }
        
        // Wait 1 second before retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Jika semua retry gagal, cek apakah ini request penting
      if (process.env.NODE_ENV === 'development') {
        console.log("❌ All token refresh attempts failed");
      }
      
      // Untuk request yang tidak kritis, return error biasa tanpa logout
      // Untuk request kritis (seperti auth), bisa logout
      const isCriticalRequest = path.includes('/auth/') || path.includes('/user/');
      
      if (isCriticalRequest) {
        if (process.env.NODE_ENV === 'development') {
          console.log("🚪 Critical request failed, logging out");
        }
        logoutAndRedirect();
        throw new Error("Authentication failed");
      } else {
        // Untuk request non-kritis, throw error biasa
        throw new Error("Session expired. Please refresh the page.");
      }
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
