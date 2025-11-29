import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { getToken, getUser } from "./tokenStorage";
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
    const user = getUser();
    const roles = (payload && payload.roles) || (user && (user.roles || (user.role_name ? [user.role_name] : null)));
    if (!roles) return false;
    
    return roles.some(role => 
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
    const user = getUser();
    const roles = (payload && payload.roles) || (user && (user.roles || (user.role_name ? [user.role_name] : null)));
    if (!roles) return false;
    
    const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return roles.some(role => 
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
    const user = getUser();
    if (!payload && !user) return null;
    const roles = (payload && payload.roles) || (user && (user.roles || (user.role_name ? [user.role_name] : null)));
    return roles || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get current user's role ID from JWT or stored user
 * @returns {number|null}
 */
export const getCurrentRoleId = () => {
  try {
    const token = getToken();
    const payload = token ? decodeJWT(token) : null;
    const user = getUser();
    const rid = (user && user.role_id) || (payload && payload.role_id) || null;
    return typeof rid === 'string' ? Number(rid) : rid;
  } catch (error) {
    console.error('Error getting role id:', error);
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
