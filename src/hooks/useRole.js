import { useState, useEffect } from 'react';
import { isAdmin, hasRole, getCurrentUserRole } from '@/lib/utils';

/**
 * Custom hook for role-based access control
 * @returns {object} Role checking utilities
 */
export const useRole = () => {
  const [userRole, setUserRole] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    // Get initial role data
    const role = getCurrentUserRole();
    const adminStatus = isAdmin();
    
    setUserRole(role);
    setIsUserAdmin(adminStatus);
  }, []);

  /**
   * Check if current user is admin
   * @returns {boolean}
   */
  const checkIsAdmin = () => {
    const adminStatus = isAdmin();
    setIsUserAdmin(adminStatus);
    return adminStatus;
  };

  /**
   * Check if current user has specific role(s)
   * @param {string|string[]} requiredRoles - Role(s) to check for
   * @returns {boolean}
   */
  const checkHasRole = (requiredRoles) => {
    return hasRole(requiredRoles);
  };

  /**
   * Get current user role
   * @returns {string|string[]|null}
   */
  const getRole = () => {
    const role = getCurrentUserRole();
    setUserRole(role);
    return role;
  };

  /**
   * Refresh role data (useful after login/logout)
   */
  const refreshRole = () => {
    const role = getCurrentUserRole();
    const adminStatus = isAdmin();
    
    setUserRole(role);
    setIsUserAdmin(adminStatus);
  };

  return {
    userRole,
    isUserAdmin,
    checkIsAdmin,
    checkHasRole,
    getRole,
    refreshRole,
    // Convenience methods
    isAdmin: checkIsAdmin,
    hasRole: checkHasRole
  };
};
