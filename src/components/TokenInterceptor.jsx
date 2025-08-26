import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { checkAndRefreshToken } from '../lib/tokenUtils';

export default function TokenInterceptor() {
  const location = useLocation();
  const lastCheckRef = useRef(0);

  useEffect(() => {
    // Auto refresh token setiap 15 menit
    const checkToken = async () => {
      const now = Date.now();
      
      // Prevent multiple checks within 5 seconds
      if (now - lastCheckRef.current < 5000) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏭️ Skipping token check (too soon)');
        }
        return;
      }
      
      lastCheckRef.current = now;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Background token check...');
      }
      
      try {
        const tokenValid = await checkAndRefreshToken();
        if (!tokenValid && process.env.NODE_ENV === 'development') {
          console.log('❌ Background token check failed');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error during background token check:', error);
        }
      }
    };

    // Set up interval untuk auto refresh setiap 15 menit
    const interval = setInterval(() => {
      if (location.pathname !== '/') {
        checkToken();
      }
    }, 900000); // 15 minutes

    return () => {
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Component ini tidak render apapun
  return null;
}
