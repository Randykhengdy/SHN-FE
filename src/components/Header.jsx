import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserInfo } from "@/lib/jwtUtils";
import { clearAllTokens } from "@/lib/tokenStorage";
import logo from "@/assets/logo.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [showMasterdataMenu, setShowMasterdataMenu] = useState(false);

  useEffect(() => {
    // Get user info dari JWT token
    const info = getUserInfo();
    console.log('🎯 Header - User info from JWT:', info);
    console.log('🎯 Header - Roles from userInfo:', info?.roles);
    console.log('🎯 Header - Roles type:', typeof info?.roles);
    console.log('🎯 Header - Is roles array:', Array.isArray(info?.roles));
    console.log('🎯 Header - User name:', info?.name);
    console.log('🎯 Header - Username:', info?.username);
    setUserInfo(info);
  }, []);

  const handleLogout = () => {
    // Clear all tokens using tokenStorage system
    clearAllTokens();
    
    console.log('🚪 Logout completed, redirecting to login...');
    
    // Always use navigate untuk konsistensi routing
    navigate("/", { replace: true });
  };

  // Format roles untuk display
  const formatRoles = (roles) => {
    console.log('🎨 formatRoles called with:', roles);
    console.log('🎨 roles type:', typeof roles);
    console.log('🎨 is array:', Array.isArray(roles));
    
    if (!roles || roles.length === 0) {
      console.log('🎨 No roles found, returning "Loading roles..."');
      return "Loading roles...";
    }
    
    if (typeof roles === 'string') {
      console.log('🎨 String role, formatting:', roles);
      return roles.charAt(0).toUpperCase() + roles.slice(1);
    }
    
    console.log('🎨 Array roles, mapping:', roles);
    const formatted = roles.map(role => {
      if (typeof role === 'object' && role.name) return role.name;
      return String(role).charAt(0).toUpperCase() + String(role).slice(1);
    }).join(", ");
    
    console.log('🎨 Final formatted roles:', formatted);
    return formatted;
  };

  return (
    <div className="flex justify-between items-center bg-white px-6 py-3 shadow-sm border-b">
      {/* Logo dan Brand */}
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg mr-3" />
        <div className="font-bold text-lg text-gray-800">SURYALOGAMJAYA</div>
      </div>

      {/* User Info dan Logout */}
      <div className="flex items-center gap-4">
        {userInfo ? (
          <>
            {/* User Info */}
            <div className="flex flex-col items-end">
              <div className="font-semibold text-gray-800 text-sm">
                {userInfo.name || userInfo.username || "User"}
              </div>
              <div className="text-gray-500 text-xs">
                {formatRoles(userInfo.roles)}
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300"></div>
            
            {/* Version */}
            <div className="text-gray-500 text-xs">v1.0.0</div>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300"></div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white border-none rounded-md px-4 py-2 font-semibold cursor-pointer hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          // Fallback jika user info tidak tersedia
          <div className="flex items-center gap-4">
            <div className="text-gray-500 text-sm">Loading...</div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white border-none rounded-md px-4 py-2 font-semibold cursor-pointer hover:bg-red-600 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
