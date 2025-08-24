import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { checkAndRefreshToken, getTokenInfo } from '../lib/tokenUtils';

export default function TokenInterceptor() {
  const location = useLocation();

  useEffect(() => {
    // Auto refresh token setiap kali route berubah
    const checkToken = async () => {
      console.log('🔍 Auto refresh check on route change...');
      
      try {
        const tokenValid = await checkAndRefreshToken();
        if (!tokenValid) {
          console.log('❌ Auto refresh failed on route change');
          return;
        }
        
        // Log token info untuk debugging
        const tokenInfo = getTokenInfo();
        console.log('✅ Token status:', tokenInfo);
      } catch (error) {
        console.error('❌ Error during auto refresh:', error);
      }
    };

    // Auto refresh token saat component mount dan setiap route change
    checkToken();

    // Set up interval untuk auto refresh setiap 30 detik
    const interval = setInterval(checkToken, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [location.pathname]);

  // Component ini tidak render apapun
  return null;
}
