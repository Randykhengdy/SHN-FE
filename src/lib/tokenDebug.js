import { getTokenInfo, isRefreshTokenExpired, checkAndRefreshToken } from './tokenUtils';

// Fungsi untuk debug token status
export function debugTokenStatus() {
  console.log('🔍 === TOKEN DEBUG INFO ===');
  
  const tokenInfo = getTokenInfo();
  const refreshTokenExpired = isRefreshTokenExpired();
  
  console.log('📋 Access Token Status:', {
    exists: !!localStorage.getItem('token'),
    valid: tokenInfo.valid,
    expired: tokenInfo.expired,
    expiresAt: tokenInfo.expiresAt,
    hasRefreshToken: tokenInfo.hasRefreshToken
  });
  
  console.log('🔄 Refresh Token Status:', {
    exists: !!localStorage.getItem('refresh_token'),
    expired: refreshTokenExpired
  });
  
  console.log('👤 User Info:', {
    isLoggedIn: localStorage.getItem('isLoggedIn'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  });
  
  console.log('🔍 === END DEBUG INFO ===');
}

// Fungsi untuk test refresh token
export async function testRefreshToken() {
  console.log('🧪 === TESTING REFRESH TOKEN ===');
  
  try {
    const result = await checkAndRefreshToken();
    console.log('✅ Refresh test result:', result);
    return result;
  } catch (error) {
    console.error('❌ Refresh test failed:', error);
    return false;
  }
}

// Fungsi untuk clear all tokens (untuk testing)
export function clearAllTokens() {
  console.log('🧹 Clearing all tokens...');
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('user');
  console.log('✅ All tokens cleared');
}

// Fungsi untuk simulate token expiration (untuk testing)
export function simulateTokenExpiration() {
  console.log('⏰ Simulating token expiration...');
  
  // Set token to expired value
  const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  localStorage.setItem('token', expiredToken);
  console.log('✅ Token set to expired state');
}

// Export untuk global access (untuk debugging di console)
if (typeof window !== 'undefined') {
  window.tokenDebug = {
    debugTokenStatus,
    testRefreshToken,
    clearAllTokens,
    simulateTokenExpiration
  };
  
  console.log('🔧 Token debug utilities available at window.tokenDebug');
  console.log('📝 Usage:');
  console.log('  - window.tokenDebug.debugTokenStatus()');
  console.log('  - window.tokenDebug.testRefreshToken()');
  console.log('  - window.tokenDebug.clearAllTokens()');
  console.log('  - window.tokenDebug.simulateTokenExpiration()');
}
