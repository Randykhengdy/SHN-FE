// Utility untuk decode JWT token
export function decodeJWT(token) {
  try {
    if (!token) return null;
    
    // JWT terdiri dari 3 bagian yang dipisahkan oleh titik
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (bagian kedua)
    const payload = parts[1];
    
    // Base64 decode dan parse JSON
    const decodedPayload = JSON.parse(atob(payload));
    
    return decodedPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Get user info dari JWT token
export function getUserInfo() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('🔍 No token found in localStorage');
    return null;
  }
  
  const payload = decodeJWT(token);
  if (!payload) {
    console.log('🔍 Failed to decode JWT payload');
    return null;
  }
  
  console.log('🔍 JWT Payload:', payload);
  
  // Check different possible role fields
  const roles = payload.roles || payload.role || payload.user_roles || payload.authorities || [];
  console.log('🔍 Extracted roles:', roles);
  console.log('🔍 Roles type:', typeof roles);
  console.log('🔍 Is Array:', Array.isArray(roles));
  
  const userInfo = {
    name: payload.name || payload.full_name || payload.display_name,
    username: payload.username || payload.user_name || payload.preferred_username,
    email: payload.email,
    roles: Array.isArray(roles) ? roles : [roles].filter(Boolean),
    id: payload.sub || payload.id || payload.user_id
  };
  
  console.log('🔍 Final user info:', userInfo);
  return userInfo;
}

// Get roles dari JWT token
export function getUserRoles() {
  const userInfo = getUserInfo();
  return userInfo?.roles || [];
}

// Check apakah user punya role tertentu
export function hasRole(roleName) {
  const roles = getUserRoles();
  return roles.includes(roleName);
}

// Check apakah user punya salah satu dari roles
export function hasAnyRole(roleNames) {
  const roles = getUserRoles();
  return roleNames.some(role => roles.includes(role));
}
