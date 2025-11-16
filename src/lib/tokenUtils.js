import { jwtDecode } from 'jwt-decode';
import { authService } from '@/services/authService';
import { 
  getToken, 
  setToken, 
  removeToken, 
  getRefreshToken, 
  setRefreshToken, 
  removeRefreshToken,
  setTokenType,
  setIsLoggedIn,
  setUser,
  clearAllTokens,
  getStorageInfo
} from './tokenStorage';

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
export function logoutAndRedirect(showNotification = true) {
  console.log('🚪 Logging out due to token expiration...');
  
  // Check if we're already on the login page to prevent infinite loops
  const currentPath = window.location.hash ? window.location.hash.slice(1) : window.location.pathname;
  const isOnLoginPage = currentPath === '/' || currentPath === '';
  
  // Show user notification if requested and not already on login page
  if (showNotification && !isOnLoginPage) {
    // Dispatch custom event for modal alert (non-blocking)
    try {
      setTimeout(() => {
        // Dispatch custom event that can be listened by React components
        const event = new CustomEvent('showAlert', {
          detail: {
            title: 'Session Expired',
            message: 'Session expired. You will be redirected to login page.',
            type: 'warning'
          }
        });
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.log('Could not show logout notification:', error);
    }
  }
  
  // Use authService logout untuk cleanup yang lebih baik
  authService.logout();
  
  // Clear all tokens using new storage utility
  clearAllTokens();
  
  // Only redirect if we're not already on the login page
  if (!isOnLoginPage) {
    // Try to use React Router navigate if available (better for SPA)
    if (window.__reactNavigate) {
      console.log('🔄 Using React Router navigate for logout redirect');
      window.__reactNavigate('/', { replace: true });
      return;
    }
    
    // Fallback: Redirect ke login page - support both hash routing and regular routing
    console.log('🔄 Using window.location for logout redirect');
    // For HashRouter, we need to set the hash
    if (window.location.hash) {
      window.location.hash = '#/';
    } else {
      window.location.href = '/';
    }
    
    // Also reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  } else {
    console.log('🔄 Already on login page, skipping redirect to prevent loop');
  }
}

// Fungsi untuk cek dan auto refresh token
export async function checkAndRefreshToken() {
  const token = getToken();
  const refreshToken = getRefreshToken();
  
  // Check if we're on login page to prevent unnecessary logout calls
  const currentPath = window.location.hash ? window.location.hash.slice(1) : window.location.pathname;
  const isOnLoginPage = currentPath === '/' || currentPath === '';
  
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Token check - Access:", !!token, "Refresh:", !!refreshToken);
    console.log("🔧 Storage info:", getStorageInfo());
  }
  
  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log("🚨 No access token, attempting refresh...");
    }
    if (refreshToken) {
      const refreshSuccess = await performTokenRefresh();
      if (refreshSuccess) {
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Refresh successful");
        }
        return true;
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.log("❌ No tokens available, logging out");
    }
    // Only call logoutAndRedirect if not on login page
    if (!isOnLoginPage) {
      logoutAndRedirect();
    }
    return false;
  }
  
  // Jika token sudah expired, coba refresh dulu
  if (isTokenExpired(token)) {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 Token expired, auto refreshing...");
    }
    const refreshSuccess = await performTokenRefresh();
    
    if (!refreshSuccess) {
      if (process.env.NODE_ENV === 'development') {
        console.log("❌ Auto refresh failed, logging out");
      }
      // Only call logoutAndRedirect if not on login page
      if (!isOnLoginPage) {
        logoutAndRedirect();
      }
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log("✅ Auto refresh successful");
    }
    return true;
  }
  
  // Jika token akan expired dalam 10 menit, refresh sekarang
  if (willTokenExpireSoon(token, 10)) {
    if (process.env.NODE_ENV === 'development') {
      console.log("🔄 Token expiring soon (10 min), proactive refresh");
    }
    const refreshSuccess = await performTokenRefresh();
    
    if (!refreshSuccess && process.env.NODE_ENV === 'development') {
      console.log("⚠️ Proactive refresh failed, but token still valid");
    }
    
    return true;
  }
  
  return true;
}

// Fungsi untuk refresh token dengan retry logic
export async function performTokenRefresh() {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.log("❌ No refresh token available");
        return false;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Token refresh attempt ${retryCount + 1}/${maxRetries + 1}`);
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      if (result.success) {
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Token refreshed successfully");
        }
        
        // Update tokens using new storage utility
        setToken(result.token);
        setTokenType(result.token_type);
        setIsLoggedIn("true");
        
        // Update refresh token jika ada yang baru
        if (result.refresh_token) {
          setRefreshToken(result.refresh_token);
          if (process.env.NODE_ENV === 'development') {
            console.log("✅ New refresh token saved");
          }
        }
        
        // Update user info jika ada
        if (result.user) {
          setUser(result.user);
        }
        
        return true;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log("❌ Failed to refresh token:", result.message);
        }
        
        // Jika refresh token expired atau invalid, logout
        if (result.message?.includes('expired') || result.message?.includes('invalid') || result.message?.includes('Unauthorized')) {
          if (process.env.NODE_ENV === 'development') {
            console.log("🚪 Refresh token expired/invalid, logging out");
          }
          // Check if we're on login page to prevent unnecessary logout calls
          const currentPath = window.location.hash ? window.location.hash.slice(1) : window.location.pathname;
          const isOnLoginPage = currentPath === '/' || currentPath === '';
          if (!isOnLoginPage) {
            logoutAndRedirect();
          }
          return false;
        }
        
        // Retry jika bukan karena token expired
        if (retryCount < maxRetries) {
          retryCount++;
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        return false;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ Error refreshing token (attempt ${retryCount + 1}):`, error);
      }
      
      if (retryCount < maxRetries) {
        retryCount++;
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏳ Retrying in 1 second... (${retryCount}/${maxRetries})`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      return false;
    }
  }
  
  return false;
}

// Alias function untuk backward compatibility
export async function refreshToken() {
  return performTokenRefresh();
}

// Fungsi untuk get token info (untuk debugging)
export function getTokenInfo() {
  const token = getToken();
  const refreshToken = getRefreshToken();
  
  if (!token) {
    return { 
      valid: false, 
      message: 'No token found',
      hasRefreshToken: !!refreshToken,
      storageInfo: getStorageInfo()
    };
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
      hasRefreshToken: !!refreshToken,
      payload: decoded,
      storageInfo: getStorageInfo()
    };
  } catch (error) {
    return { 
      valid: false, 
      message: 'Invalid token', 
      error: error.message,
      hasRefreshToken: !!refreshToken,
      storageInfo: getStorageInfo()
    };
  }
}

// Fungsi untuk cek apakah refresh token expired
export function isRefreshTokenExpired() {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) return true;
  
  // Cek apakah ini JWT token atau UUID string
  const isJWT = refreshToken.split('.').length === 3;
  
  if (!isJWT) {
    // Jika bukan JWT (misalnya UUID), anggap tidak expired
    // Refresh token UUID biasanya tidak punya expiration time
    console.log('🔍 Refresh token is UUID format, no expiration check needed');
    return false;
  }
  
  try {
    const decoded = jwtDecode(refreshToken);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp && decoded.exp < currentTime) {
      console.log('🔍 Refresh token expired at:', new Date(decoded.exp * 1000));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error decoding refresh token:', error);
    // Jika error decode, anggap token tidak valid
    return true;
  }
}
