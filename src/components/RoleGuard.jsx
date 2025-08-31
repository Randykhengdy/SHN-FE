import React from 'react';
import { useRole } from '@/hooks/useRole';

/**
 * RoleGuard component for conditional rendering based on user roles
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if role check passes
 * @param {string|string[]} props.roles - Required role(s) to access content
 * @param {boolean} props.adminOnly - If true, only admin can access (shorthand for roles={['admin']})
 * @param {React.ReactNode} props.fallback - Content to render if role check fails (optional)
 * @param {boolean} props.hide - If true, render nothing instead of fallback when role check fails
 * @returns {React.ReactNode}
 */
const RoleGuard = ({ 
  children, 
  roles, 
  adminOnly = false, 
  fallback = null, 
  hide = false 
}) => {
  const { hasRole, isAdmin } = useRole();

  // Determine required roles
  let requiredRoles = roles;
  if (adminOnly) {
    requiredRoles = ['admin', 'super', 'owner'];
  }

  // Check if user has required role
  const hasAccess = requiredRoles ? hasRole(requiredRoles) : isAdmin();

  // If hide is true and no access, render nothing
  if (hide && !hasAccess) {
    return null;
  }

  // If no access, render fallback or nothing
  if (!hasAccess) {
    return fallback;
  }

  // User has access, render children
  return children;
};

export default RoleGuard;
