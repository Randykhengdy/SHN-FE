import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TabLayout = ({ children }) => {
  const { tabs, activeTabId, closeTab, switchTab, addTab } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // === Electron IPC Navigation Listener ===
  const addTabRef = useRef(addTab);
  const navigateRef = useRef(navigate);
  useEffect(() => {
    addTabRef.current = addTab;
  }, [addTab]);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!window.electronAPI) return;
    if (window.__electronNavRegistered) return;
    window.__electronNavRegistered = true;

    const handleNavigate = (_event, path, label) => {
      console.log('[TabLayout] IPC navigate-to received:', path, label);
      if (addTabRef.current) {
        addTabRef.current(path, label);
      }
      // Navigasi langsung ke path yang diminta
      if (navigateRef.current) {
        navigateRef.current(path);
      }
    };

    window.electronAPI.onNavigate(handleNavigate);
  }, []);

  // === Menu Visibility ===
  useEffect(() => {
    if (!window.electronAPI) return;
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
      window.electronAPI.hideMenu();
    } else {
      window.electronAPI.showMenu();
    }
  }, [location]);

  // === Tab UI Logic ===
  const handleTabClick = (tab) => {
    switchTab(tab.id);
    navigate(tab.path);
  };

  const handleCloseTab = useCallback((e, id) => {
    e.stopPropagation();

    // Cari tab yang akan ditutup dan tentukan tab pengganti
    const idx = tabs.findIndex(t => t.id === id);
    const isClosingActive = id === activeTabId;

    closeTab(id);

    if (isClosingActive) {
      // Navigasi ke tab lain setelah menutup tab aktif
      const remaining = tabs.filter(t => t.id !== id);
      if (remaining.length > 0) {
        // Pilih tab sebelumnya, atau yang pertama
        const nextTab = remaining[Math.min(idx, remaining.length - 1)] || remaining[remaining.length - 1];
        navigate(nextTab.path);
      } else {
        // Tidak ada tab tersisa, kembali ke dashboard
        navigate('/dashboard');
      }
    }
  }, [tabs, activeTabId, closeTab, navigate]);

  const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);

  // Auto-add current location as tab on first load (e.g. dashboard after login)
  useEffect(() => {
    if (!isAuthPage && tabs.length === 0 && location.pathname !== '/') {
      addTab(location.pathname);
    }
  }, [isAuthPage, tabs.length, location.pathname, addTab]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div className="flex items-end px-2 pt-2 bg-slate-200/50 border-b border-slate-300 gap-1 overflow-x-auto no-scrollbar min-h-[40px]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;

            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "group relative flex items-center h-9 px-4 min-w-[120px] max-w-[200px] cursor-pointer transition-all duration-200 rounded-t-lg select-none",
                  isActive
                    ? "bg-white text-blue-600 shadow-sm border-t border-l border-r border-slate-300 z-10 font-medium"
                    : "bg-slate-300/40 text-slate-600 hover:bg-slate-300/60 border-t border-l border-r border-transparent"
                )}
              >
                <span className="truncate text-sm mr-2">{tab.label}</span>
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className={cn(
                    "ml-auto p-0.5 rounded-full hover:bg-slate-200 transition-colors",
                    isActive ? "text-slate-400 hover:text-red-500" : "text-slate-400 group-hover:text-slate-600"
                  )}
                >
                  <X size={14} />
                </button>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-white z-20" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto relative">
        {children}
      </div>
    </div>
  );
};

export default TabLayout;
