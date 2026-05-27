import React, { useEffect, useRef, useCallback, useState } from 'react';
import { MemoryRouter, HashRouter, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import AppRouter from '@/router/AppRouter';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import TokenInterceptor from '@/components/TokenInterceptor';
import { useAlert } from '@/hooks/useAlert';

// Komponen wrapper yang mendeteksi auth page dan mengelola IPC
const TabLayoutInner = () => {
  const { tabs, activeTabId, closeTab, switchTab, addTab } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // === Electron IPC Navigation Listener ===
  const addTabRef = useRef(addTab);
  useEffect(() => {
    addTabRef.current = addTab;
  }, [addTab]);

  useEffect(() => {
    if (!window.electronAPI) return;
    if (window.__electronNavRegistered) return;
    window.__electronNavRegistered = true;

    const handleNavigate = (_event, path, label) => {
      console.log('[TabLayout] IPC navigate-to received:', path, label);
      if (addTabRef.current) {
        addTabRef.current(path, label);
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

  const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);

  // Ketika user login dan pindah ke dashboard, buat tab pertama
  useEffect(() => {
    if (!isAuthPage && tabs.length === 0 && location.pathname !== '/') {
      addTab(location.pathname);
    }
  }, [isAuthPage, tabs.length, location.pathname, addTab]);

  // Jika sudah ada tabs, jangan render via HashRouter Routes lagi
  // (konten dirender oleh MemoryRouter per-tab di TabLayout)
  if (!isAuthPage && tabs.length > 0) {
    return null;
  }

  // Render halaman auth (login/register) lewat HashRouter
  return <AppRouter />;
};

// Komponen tab bar + content area
const TabLayout = () => {
  const { tabs, activeTabId, closeTab, switchTab } = useAppContext();
  const { AlertComponent } = useAlert();

  const handleTabClick = (tab) => {
    switchTab(tab.id);
  };

  const handleCloseTab = useCallback((e, id) => {
    e.stopPropagation();
    closeTab(id);
  }, [closeTab]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* HashRouter untuk auth pages + IPC listener + Global components */}
      <HashRouter>
        <TokenInterceptor />
        <AlertComponent />
        <TabLayoutInner />
      </HashRouter>

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

      {/* Content Area — semua tab di-render bersamaan, hanya tab aktif yang visible */}
      {tabs.length > 0 && (
        <div className="flex-1 overflow-hidden relative">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                display: tab.id === activeTabId ? 'flex' : 'none',
                flexDirection: 'column',
                height: '100%',
                overflow: 'auto',
              }}
            >
              <MemoryRouter initialEntries={[tab.path]}>
                <AppRouter />
              </MemoryRouter>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabLayout;
