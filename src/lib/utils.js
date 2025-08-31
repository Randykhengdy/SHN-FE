import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { getToken } from "./tokenStorage";
import { decodeJWT } from "./jwtUtils";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Check if current user has admin role
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdmin = () => {
  try {
    const token = getToken();
    if (!token) return false;
    
    const payload = decodeJWT(token);
    if (!payload || !payload.roles) return false;
    
    return payload.roles.some(role => 
      role.toLowerCase().includes('admin') || 
      role.toLowerCase().includes('super') ||
      role.toLowerCase().includes('owner')
    );
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
};

/**
 * Check if current user has specific role
 * @param {string|string[]} requiredRoles - Role(s) to check for
 * @returns {boolean} True if user has required role, false otherwise
 */
export const hasRole = (requiredRoles) => {
  try {
    const token = getToken();
    if (!token) return false;
    
    const payload = decodeJWT(token);
    if (!payload || !payload.roles) return false;
    
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return payload.roles.some(role => 
      rolesToCheck.some(requiredRole => 
        role.toLowerCase().includes(requiredRole.toLowerCase())
      )
    );
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};

/**
 * Get current user role(s)
 * @returns {string|string[]|null} User role(s) or null if not found
 */
export const getCurrentUserRole = () => {
  try {
    const token = getToken();
    if (!token) return null;
    
    const payload = decodeJWT(token);
    if (!payload) return null;
    
    return payload.roles || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Debug function to check all stored data
 */
export const debugStorage = () => {
  try {
    const token = getToken();
    const payload = token ? decodeJWT(token) : null;
    console.log('🔍 Debug Storage - Token:', token ? 'exists' : 'not found');
    console.log('🔍 Debug Storage - JWT Payload:', payload);
    console.log('🔍 Debug Storage - Is Admin:', isAdmin());
    console.log('🔍 Debug Storage - Current Role:', getCurrentUserRole());
    console.log('🔍 Debug Storage - Has Role admin:', hasRole('admin'));
    console.log('🔍 Debug Storage - Has Role super:', hasRole('super'));
    return { payload, isAdmin: isAdmin(), role: getCurrentUserRole() };
  } catch (error) {
    console.error('Error in debugStorage:', error);
    return null;
  }
};
