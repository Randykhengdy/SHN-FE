import { getAuthHeader } from "../api/GetAuthHeader";
import apiConfig from "../config/api";
import { performTokenRefresh, logoutAndRedirect, checkAndRefreshToken } from "./tokenUtils";

export async function request(path, options = {}) {
  // Proactive token check before making request
  try {
    await checkAndRefreshToken();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log("⚠️ Proactive token check failed:", error.message);
    }
    // Continue with request even if proactive check fails
  }

  const isFormData = options && options.body && options.body instanceof FormData;
  const mergedHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const isCanvasEndpoint = /canvas/i.test(path);
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (!isCanvasEndpoint && process.env.NODE_ENV === 'development') {
      console.error("API Error:", response.status, errorText);
      console.log("🔍 Raw error response:", errorText);
    }
    
    // Cek apakah error 401 (Unauthorized) - coba refresh token dulu
    if (response.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 401 Unauthorized - Attempting token refresh...");
      }
      
      // Coba refresh token dengan retry
      let refreshSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          refreshSuccess = await performTokenRefresh();
          if (refreshSuccess) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Token refreshed on attempt ${attempt}`);
            }
            // Jangan retry di sini untuk mencegah loop; biarkan caller memanggil ulang bila perlu
            throw new Error("Unauthorized. Token refreshed. Please retry.");
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Token refresh attempt ${attempt} failed:`, error.message);
          }
        }
        
        // Wait 1 second before retry
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Jika semua retry gagal, logout
      if (!isCanvasEndpoint && process.env.NODE_ENV === 'development') {
        console.log("❌ All token refresh attempts failed, logging out");
      }
      
      logoutAndRedirect();
      throw new Error("Session expired. Please login again.");
    }
    
    // Coba parse error response sebagai JSON untuk mendapatkan message yang lebih spesifik
    let errorMessage = null;
    
    try {
      const errorJson = JSON.parse(errorText);
      
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
      
      if (errorMessage && !isCanvasEndpoint && process.env.NODE_ENV === 'development') {
        console.log("✅ Using API error message:", errorMessage);
      }
    } catch (e) {
      // Silent for canvas endpoints to avoid spam
      if (!isCanvasEndpoint && process.env.NODE_ENV === 'development') {
        console.error("❌ Error parsing error response:", e);
        console.log("🔍 Using fallback error message");
      }
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
