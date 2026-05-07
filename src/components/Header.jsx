import { useState, useEffect } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
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
  const [appVersion, setAppVersion] = useState("-");
  const [updateState, setUpdateState] = useState({ type: null, percent: null, message: null });
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    // Get user info dari JWT token
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.getVersion === 'function') {
      window.electronAPI.getVersion().then(v => {
        if (v) setAppVersion(String(v));
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.onUpdateEvent === 'function') {
      window.electronAPI.onUpdateEvent((ev) => {
        if (!ev || !ev.type) return;
        if (ev.type === 'progress') {
          const p = ev.progress && typeof ev.progress.percent === 'number' ? ev.progress.percent : null;
          setUpdateState({ type: 'progress', percent: p, message: null });
        } else if (ev.type === 'available') {
          setUpdateState({ type: 'available', percent: null, message: `v${ev.info?.version}` });
        } else if (ev.type === 'checking') {
          setUpdateState({ type: 'checking', percent: null, message: null });
        } else if (ev.type === 'none') {
          setUpdateState({ type: 'none', percent: null, message: null });
        } else if (ev.type === 'downloaded') {
          setUpdateState({ type: 'downloaded', percent: 100, message: null });
        } else if (ev.type === 'error') {
          setUpdateState({ type: 'error', percent: null, message: ev.error });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (window.electronAPI && typeof window.electronAPI.onRequestConfirm === 'function') {
      window.electronAPI.onRequestConfirm((data) => {
        setConfirmData(data);
      });
    }
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
        <div className="font-bold text-lg text-gray-800">SURYA LOGAM JAYA</div>
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

            <div className="text-gray-500 text-xs">v{appVersion}</div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Update indicator */}
            <div className="flex items-center gap-2">
              {updateState.type === 'checking' && (
                <span className="text-xs text-gray-600">Checking…</span>
              )}
              {updateState.type === 'available' && (
                <span className="text-xs text-green-600">Update {updateState.message} tersedia</span>
              )}
              {updateState.type === 'progress' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600">Downloading {updateState.percent ?? 0}%</span>
                  <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                    <div className="h-2 bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, updateState.percent ?? 0))}%` }} />
                  </div>
                </div>
              )}
              {updateState.type === 'downloaded' && (
                <span className="text-xs text-green-600">Downloaded</span>
              )}
              {updateState.type === 'error' && (
                <span className="text-xs text-red-600">Error</span>
              )}
              {updateState.type === 'progress' && window.electronAPI && (
                <button
                  onClick={() => { try { window.electronAPI.cancelDownloadUpdate(); } catch (_) { } }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}
            </div>

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

      {confirmData && (
        <AlertDialog.Root open onOpenChange={(open) => { if (!open) { window.electronAPI.sendConfirmResult(confirmData.id, false); setConfirmData(null); } }}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] rounded-lg bg-white shadow-xl p-4">
              <AlertDialog.Title className="text-base font-semibold text-gray-900">{confirmData.title || 'Konfirmasi'}</AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 mt-2">{confirmData.message || 'Lanjutkan?'}</AlertDialog.Description>
              <div className="flex justify-end gap-2 mt-4">
                <AlertDialog.Cancel asChild>
                  <button className="px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { window.electronAPI.sendConfirmResult(confirmData.id, false); setConfirmData(null); }}>Batal</button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700" onClick={() => { window.electronAPI.sendConfirmResult(confirmData.id, true); setConfirmData(null); }}>Download</button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </div>
  );
}
