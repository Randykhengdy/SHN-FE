import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';

const useElectronNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { addTab } = useAppContext();
  const addTabRef = useRef(addTab);

  // Selalu update ref dengan addTab terbaru dari context
  useEffect(() => {
    addTabRef.current = addTab;
  }, [addTab]);

  // Menangani navigasi dari menu Electron
  const lastLogRef = useRef({ path: null, ts: 0 });
  useEffect(() => {
    if (!window.electronAPI) return;
    if (window.__electronNavRegistered) return;
    window.__electronNavRegistered = true;

    // Listener untuk event navigate-to dari main process
    const handleNavigate = (event, path, label) => {
      const now = Date.now();
      const windowThrottle = 1000;
      const canLog = (now - (lastLogRef.current.ts || 0)) > windowThrottle;
      if (canLog) {
        console.log('[ElectronNav] Event received:', { path, label });
        lastLogRef.current = { path, ts: now };
      }
      
      // Gunakan ref agar selalu memanggil versi terbaru dari addTab
      if (addTabRef.current) {
        addTabRef.current(path, label);
      }
    };

    // Register listener
    window.electronAPI.onNavigate((event, path, label) => handleNavigate(event, path, label));

    // Cleanup listener saat komponen unmount
    return () => {
      // Note: IPC listeners cleanup is handled in Electron preload; no explicit off API here
    };
  }, []);

  // Menangani tampilan menu berdasarkan path
  useEffect(() => {
    if (!window.electronAPI) return;

    // Jika path adalah root atau login, sembunyikan menu
    if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
      window.electronAPI.hideMenu();
    } else {
      window.electronAPI.showMenu();
    }
  }, [location]);
};

export default useElectronNavigation;
