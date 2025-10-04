import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkAndRefreshToken, isTokenExpired, willTokenExpireSoon } from '../lib/tokenUtils';
import { getToken } from '../lib/tokenStorage';

export default function TokenInterceptor() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastCheckRef = useRef(0);
  const intervalRef = useRef(null);
  
  // Make navigate function available globally for tokenUtils
  useEffect(() => {
    window.__reactNavigate = navigate;
    return () => {
      delete window.__reactNavigate;
    };
  }, [navigate]);

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

    // Only run token checks if not on login page
    const isOnLoginPage = location.pathname === '/' || location.pathname === '';
    
    // Immediate check when component mounts (only if not on login page)
    if (!isOnLoginPage) {
      checkToken();
    }

    // Set up interval untuk auto refresh setiap 5 menit (only if not on login page)
    intervalRef.current = setInterval(() => {
      if (!isOnLoginPage) {
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
      const token = getToken();
      if (!token) return;

      // Check every minute if token will expire soon
      if (willTokenExpireSoon(token, 10)) { // 10 minutes
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Token expiring soon, checking more frequently...');
        }
        checkAndRefreshToken();
      }
    };

    // Only run expiry checks if not on login page
    const isOnLoginPage = location.pathname === '/' || location.pathname === '';
    
    // Check every minute for token expiry (only if not on login page)
    const expiryInterval = setInterval(() => {
      if (!isOnLoginPage) {
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
      const isOnLoginPage = location.pathname === '/' || location.pathname === '';
      if (!document.hidden && !isOnLoginPage) {
        if (process.env.NODE_ENV === 'development') {
          console.log('👁️ Page became visible, checking token...');
        }
        
        // Check if token is expired when user returns
        const token = getToken();
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
      const isOnLoginPage = location.pathname === '/' || location.pathname === '';
      if (!isOnLoginPage) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🎯 Window focused, checking token...');
        }
        
        // Check if token will expire soon when user returns
        const token = getToken();
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
