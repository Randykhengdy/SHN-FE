import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { checkAndRefreshToken, isTokenExpired, willTokenExpireSoon } from '../lib/tokenUtils';

export default function TokenInterceptor() {
  const location = useLocation();
  const lastCheckRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Auto refresh token setiap 5 menit (lebih agresif)
    const checkToken = async () => {
      const now = Date.now();
      
      // Prevent multiple checks within 2 seconds
      if (now - lastCheckRef.current < 2000) {
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

    // Immediate check when component mounts
    if (location.pathname !== '/') {
      checkToken();
    }

    // Set up interval untuk auto refresh setiap 5 menit
    intervalRef.current = setInterval(() => {
      if (location.pathname !== '/') {
        checkToken();
      }
    }, 300000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [location.pathname]);

  // Additional effect for more frequent checks when token is about to expire
  useEffect(() => {
    const checkExpiry = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Check every minute if token will expire soon
      if (willTokenExpireSoon(token, 10)) { // 10 minutes
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Token expiring soon, checking more frequently...');
        }
        checkAndRefreshToken();
      }
    };

    // Check every minute for token expiry
    const expiryInterval = setInterval(() => {
      if (location.pathname !== '/') {
        checkExpiry();
      }
    }, 60000); // 1 minute

    return () => {
      clearInterval(expiryInterval);
    };
  }, [location.pathname]);

  // Handle visibility change (when user switches tabs or returns to app)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && location.pathname !== '/') {
        if (process.env.NODE_ENV === 'development') {
          console.log('👁️ Page became visible, checking token...');
        }
        
        // Check if token is expired when user returns
        const token = localStorage.getItem('token');
        if (token && isTokenExpired(token)) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Token expired while away, refreshing...');
          }
          await checkAndRefreshToken();
        }
      }
    };

    // Handle window focus (when user returns to browser tab)
    const handleFocus = async () => {
      if (location.pathname !== '/') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Window focused, checking token...');
        }
        
        // Check if token will expire soon when user returns
        const token = localStorage.getItem('token');
        if (token && willTokenExpireSoon(token, 5)) { // 5 minutes
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Token expiring soon, proactive refresh...');
          }
          await checkAndRefreshToken();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [location.pathname]);

  // Component ini tidak render apapun
  return null;
}
