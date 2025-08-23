import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const useElectronNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Menangani navigasi dari menu Electron
  useEffect(() => {
    if (!window.electronAPI) return;

    // Listener untuk event navigate-to dari main process
    const handleNavigate = (event, path) => {
      console.log('Navigating to:', path);
      navigate(path);
    };

    // Register listener
    window.electronAPI.onNavigate((event, path) => handleNavigate(event, path));

    // Cleanup listener saat komponen unmount
    return () => {
      // Tidak ada API untuk menghapus listener di preload.js, 
      // tapi ini adalah praktik yang baik untuk diimplementasikan
    };
  }, [navigate]);

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