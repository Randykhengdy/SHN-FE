import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useElectronNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menangani navigasi dari menu Electron
  const lastLogRef = useRef({ path: null, ts: 0 });
  useEffect(() => {
    if (!window.electronAPI) return;
    if (window.__electronNavRegistered) return;
    window.__electronNavRegistered = true;

    // Listener untuk event navigate-to dari main process
    const handleNavigate = (event, path) => {
      const now = Date.now();
      const windowThrottle = 2000;
      const canLog = (now - (lastLogRef.current.ts || 0)) > windowThrottle;
      if (process.env.NODE_ENV === 'development' && canLog) {
        console.log('Navigating to:', path);
        lastLogRef.current = { path, ts: now };
      }
      navigate(path);
    };

    // Register listener
    window.electronAPI.onNavigate((event, path) => handleNavigate(event, path));

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
