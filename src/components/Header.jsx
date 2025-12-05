import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserInfo } from "@/lib/jwtUtils";
import { clearAllTokens, setRolePermissionsData } from "@/lib/tokenStorage";
import { roleService } from "@/services/master-data";
import { getCurrentRoleId } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { Bell } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [showMasterdataMenu, setShowMasterdataMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Get user info dari JWT token
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  const handleLogout = () => {
    // Clear all tokens using tokenStorage system
    clearAllTokens();
    
    console.log('🚪 Logout completed, redirecting to login...');
    
    // Always use navigate untuk konsistensi routing
    navigate("/", { replace: true });
  };

  const handleRefreshPermissions = async () => {
    try {
      setRefreshing(true);
      const roleId = getCurrentRoleId();
      if (!roleId) {
        setRefreshing(false);
        return;
      }
      const data = await roleService.getRoleMenuPermissionsData(roleId);
      setRolePermissionsData(data);
    } catch (e) {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  // Format roles untuk display
  const formatRoles = (roles) => {
    if (!roles || roles.length === 0) {
      return "Loading roles...";
    }
    
    if (typeof roles === 'string') {
      return roles.charAt(0).toUpperCase() + roles.slice(1);
    }
    
    const formatted = roles.map(role => {
      if (typeof role === 'object' && role.name) return role.name;
      return String(role).charAt(0).toUpperCase() + String(role).slice(1);
    }).join(", ");
    
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
            {/* Notifications link */}
            <button
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-1 text-sm text-gray-700 rounded-md px-2 py-1 hover:bg-gray-100"
            >
              <Bell className="w-4 h-4" />
              <span>Notifikasi</span>
            </button>
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
            
            {/* Refresh Role & Logout */}
            <button
              onClick={handleRefreshPermissions}
              className="bg-blue-500 text-white border-none rounded-md px-4 py-2 font-semibold cursor-pointer hover:bg-blue-600 transition-colors text-sm"
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Role'}
            </button>
            
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
