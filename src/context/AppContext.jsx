import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser, setUser as storageSetUser, getRolePermissionsData, setRolePermissionsData as storageSetRolePermissionsData, getToken } from '@/lib/tokenStorage';
import { roleService } from '@/services/master-data';
import { getCurrentRoleId } from '@/lib/utils';

const AppContext = createContext({
  user: null,
  rolePermissionsData: null,
  setUser: () => {},
  setRolePermissionsData: () => {},
});

export function AppProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [rolePermissionsData, setRolePermissionsDataState] = useState(null);

  useEffect(() => {
    setUserState(getUser());
    setRolePermissionsDataState(getRolePermissionsData());

    const handleUserUpdated = (e) => {
      setUserState(e.detail || getUser());
    };
    const handleRolePermDataUpdated = (e) => {
      setRolePermissionsDataState(e.detail || getRolePermissionsData());
    };
    window.addEventListener('user_updated', handleUserUpdated);
    window.addEventListener('role_permissions_data_updated', handleRolePermDataUpdated);
    return () => {
      window.removeEventListener('user_updated', handleUserUpdated);
      window.removeEventListener('role_permissions_data_updated', handleRolePermDataUpdated);
    };
  }, []);

  const setUser = (next) => {
    storageSetUser(next);
    setUserState(next);
  };
  const setRolePermissionsData = (next) => {
    storageSetRolePermissionsData(next);
    setRolePermissionsDataState(next || null);
  };

  useEffect(() => {
    if (rolePermissionsData) return;
    const token = getToken();
    const roleId = getCurrentRoleId();
    if (!token || !roleId) return;
    let cancelled = false;
    (async () => {
      try {
        const grouped = await roleService.getRoleMenuPermissionsData(roleId);
        if (!cancelled) setRolePermissionsData(grouped);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [rolePermissionsData]);

  const hasPermission = (menuCode, permissionName) => {
    const data = rolePermissionsData;
    if (!data || !Array.isArray(data.menus)) return false;
    const m = String(menuCode || '').toLowerCase();
    const p = String(permissionName || '').toLowerCase();
    const menu = data.menus.find(x => String(x.menu_code || '').toLowerCase() === m);
    if (!menu || !Array.isArray(menu.permissions)) return false;
    return menu.permissions.some(r => String(r.nama_permission || '').toLowerCase() === p);
  };

  const getPermissionsByMenuCode = (menuCode) => {
    const data = rolePermissionsData;
    if (!data || !Array.isArray(data.menus)) return [];
    const m = String(menuCode || '').toLowerCase();
    const menu = data.menus.find(x => String(x.menu_code || '').toLowerCase() === m);
    const perms = menu && Array.isArray(menu.permissions) ? menu.permissions : [];
    return perms.map(r => r.nama_permission);
  };

  const hasAnyPermission = (menuCode, permissionNames) => {
    const data = rolePermissionsData;
    if (!data || !Array.isArray(data.menus)) return false;
    const m = String(menuCode || '').toLowerCase();
    const menu = data.menus.find(x => String(x.menu_code || '').toLowerCase() === m);
    if (!menu || !Array.isArray(menu.permissions)) return false;
    const names = (permissionNames || []).map(v => String(v).toLowerCase());
    if (!names.length) return menu.permissions.length > 0;
    return menu.permissions.some(r => names.includes(String(r.nama_permission || '').toLowerCase()));
  };

  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  const addTab = (path, label) => {
    // Basic paths that shouldn't be tabs
    if (['/', '/login', '/register'].includes(path)) return;

    // Check if tab with this path already exists
    const existingIndex = tabs.findIndex(t => t.path === path);
    if (existingIndex !== -1) {
      setActiveTabId(tabs[existingIndex].id);
      return;
    }

    // Check limit
    if (tabs.length >= 5) {
      // Trigger a global alert
      const event = new CustomEvent('showAlert', {
        detail: {
          title: 'Batas Tab Tercapai',
          message: 'Anda hanya dapat membuka maksimal 5 tab. Silakan tutup tab yang tidak digunakan.',
          type: 'warning'
        }
      });
      window.dispatchEvent(event);
      return;
    }

    // Add new tab
    const newTab = {
      id: Date.now().toString(),
      path,
      label: label || path.split('/').pop()?.replace(/-/g, ' ') || 'New Tab'
    };
    
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      
      // If closing active tab, switch to another one
      if (id === activeTabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      
      return newTabs;
    });
  };

  const switchTab = (id) => {
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      setActiveTabId(id);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      rolePermissionsData, 
      setUser, 
      setRolePermissionsData, 
      hasPermission, 
      getPermissionsByMenuCode, 
      hasAnyPermission,
      tabs,
      activeTabId,
      addTab,
      closeTab,
      switchTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
