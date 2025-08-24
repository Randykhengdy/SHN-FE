import { jwtDecode } from 'jwt-decode';

// Fungsi untuk cek apakah token expired
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Cek apakah token sudah expired
    if (decoded.exp && decoded.exp < currentTime) {
      console.log('🔍 Token expired at:', new Date(decoded.exp * 1000));
      console.log('🔍 Current time:', new Date(currentTime * 1000));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return true; // Consider invalid token as expired
  }
}

// Fungsi untuk cek apakah token akan expired dalam X menit
export function willTokenExpireSoon(token, minutes = 5) {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const expirationTime = decoded.exp;
    
    if (!expirationTime) return false;
    
    const minutesUntilExpiry = (expirationTime - currentTime) / 60;
    return minutesUntilExpiry <= minutes;
  } catch (error) {
    console.error("❌ Error checking token expiration:", error);
    return true;
  }
}

// Fungsi untuk logout dan redirect
export function logoutAndRedirect() {
  console.log('🚪 Logging out due to token expiration...');
  
  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("isLoggedIn");
  
  // Redirect ke login page
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  }
}

// Fungsi untuk cek dan auto refresh token
export async function checkAndRefreshToken() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    logoutAndRedirect();
    return false;
  }
  
  // Jika token sudah expired, coba refresh dulu
  if (isTokenExpired(token)) {
    console.log("🔄 Token expired, attempting auto refresh...");
    const refreshSuccess = await refreshToken();
    
    if (!refreshSuccess) {
      console.log("❌ Auto refresh failed, logging out...");
      logoutAndRedirect();
      return false;
    }
    
    console.log("✅ Auto refresh successful!");
    return true;
  }
  
  // Jika token akan expired dalam 5 menit, refresh sekarang
  if (willTokenExpireSoon(token, 5)) {
    console.log("🔄 Token will expire soon, auto refreshing...");
    const refreshSuccess = await refreshToken();
    
    if (!refreshSuccess) {
      console.log("⚠️ Auto refresh failed, but token still valid");
      // Token masih valid, lanjutkan
      return true;
    }
    
    console.log("✅ Proactive refresh successful!");
    return true;
  }
  
  return true;
}

// Fungsi untuk refresh token
export async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    
    if (!refreshToken) {
      console.log("❌ No refresh token available");
      return false;
    }
    
    const response = await fetch("http://localhost:8000/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log("✅ Token refreshed successfully");
      
      // Update tokens
      localStorage.setItem("token", result.token);
      localStorage.setItem("token_type", result.token_type);
      if (result.refresh_token) {
        localStorage.setItem("refresh_token", result.refresh_token);
      }
      
      return true;
    } else {
      console.log("❌ Failed to refresh token:", result.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    return false;
  }
}



// Fungsi untuk get token info (untuk debugging)
export function getTokenInfo() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return { valid: false, message: 'No token found' };
  }
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp && decoded.exp < currentTime;
    
    return {
      valid: !isExpired,
      expired: isExpired,
      expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : null,
      currentTime: new Date(currentTime * 1000),
      payload: decoded
    };
  } catch (error) {
    return { valid: false, message: 'Invalid token', error: error.message };
  }
}
