import React, { useState, useEffect } from 'react';
import { getTokenInfo, checkAndRefreshToken, performTokenRefresh } from '@/lib/tokenUtils';
import { getStorageInfo, clearAllTokens, getAllData, checkAndRecoverLocalStorage, cleanupOldStorage } from '@/lib/tokenStorage';

export default function DevTools() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [allData, setAllData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateInfo = () => {
      setTokenInfo(getTokenInfo());
      setStorageInfo(getStorageInfo());
      setAllData(getAllData());
    };

    // Update info every 30 seconds
    updateInfo();
    const interval = setInterval(updateInfo, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefreshToken = async () => {
    try {
      const success = await performTokenRefresh();
      if (success) {
        setTokenInfo(getTokenInfo());
        setAllData(getAllData());
        alert('Token refreshed successfully!');
      } else {
        alert('Failed to refresh token');
      }
    } catch (error) {
      alert('Error refreshing token: ' + error.message);
    }
  };

  const handleCheckToken = async () => {
    try {
      const success = await checkAndRefreshToken();
      setTokenInfo(getTokenInfo());
      setAllData(getAllData());
      alert(success ? 'Token check successful!' : 'Token check failed');
    } catch (error) {
      alert('Error checking token: ' + error.message);
    }
  };

  const handleClearTokens = () => {
    if (confirm('Are you sure you want to clear all tokens? This will log you out.')) {
      clearAllTokens();
      setTokenInfo(getTokenInfo());
      setStorageInfo(getStorageInfo());
      setAllData(getAllData());
      alert('All tokens cleared!');
    }
  };

  const handleRecoverLocalStorage = () => {
    const recovered = checkAndRecoverLocalStorage();
    setStorageInfo(getStorageInfo());
    setAllData(getAllData());
    alert(recovered ? 'localStorage recovered successfully!' : 'localStorage recovery failed');
  };

  const handleCleanupOldStorage = () => {
    if (confirm('Are you sure you want to clean up old storage data? This will remove duplicate entries.')) {
      const cleaned = cleanupOldStorage();
      setStorageInfo(getStorageInfo());
      setAllData(getAllData());
      alert(`Cleaned up ${cleaned} old storage entries!`);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50 hover:bg-blue-700"
        title="Dev Tools"
      >
        🔧
      </button>

      {/* Dev Tools Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Dev Tools</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Storage Info */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Storage Info</h4>
            {storageInfo ? (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>localStorage:</span>
                  <span className={storageInfo.localStorageAvailable ? 'text-green-600' : 'text-red-600'}>
                    {storageInfo.localStorageAvailable ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>localStorage Keys:</span>
                  <span className="text-xs">{storageInfo.localStorageKeys}</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Items:</span>
                  <span className="text-xs">{storageInfo.memorySize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prefix:</span>
                  <span className="font-mono text-xs">{storageInfo.prefix}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </div>

          {/* Token Status */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Token Status</h4>
            {tokenInfo ? (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Valid:</span>
                  <span className={tokenInfo.valid ? 'text-green-600' : 'text-red-600'}>
                    {tokenInfo.valid ? '✅' : '❌'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <span className={tokenInfo.expired ? 'text-red-600' : 'text-green-600'}>
                    {tokenInfo.expired ? '❌' : '✅'}
                  </span>
                </div>
                {tokenInfo.expiresAt && (
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="text-xs">
                      {tokenInfo.expiresAt.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Refresh Token:</span>
                  <span className={tokenInfo.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>
                    {tokenInfo.hasRefreshToken ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </div>

          {/* Stored Data */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Stored Data</h4>
            {allData ? (
              <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                {Object.keys(allData).length === 0 ? (
                  <div className="text-gray-500">No data stored</div>
                ) : (
                  Object.entries(allData).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="truncate">{key}:</span>
                      <span className="truncate ml-2">
                        {key === 'user' ? 'Object' : value ? `${value.substring(0, 10)}...` : 'null'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Loading...</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleCheckToken}
              className="w-full bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600"
            >
              Check & Refresh Token
            </button>
            <button
              onClick={handleRefreshToken}
              className="w-full bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
            >
              Force Refresh Token
            </button>
            <button
              onClick={handleRecoverLocalStorage}
              className="w-full bg-yellow-500 text-white py-1 px-3 rounded text-sm hover:bg-yellow-600"
            >
              Recover localStorage
            </button>
            <button
              onClick={handleCleanupOldStorage}
              className="w-full bg-orange-500 text-white py-1 px-3 rounded text-sm hover:bg-orange-600"
            >
              Cleanup Old Storage
            </button>
            <button
              onClick={handleClearTokens}
              className="w-full bg-red-500 text-white py-1 px-3 rounded text-sm hover:bg-red-600"
            >
              Clear All Tokens
            </button>
            <button
              onClick={() => {
                console.log('Token Info:', tokenInfo);
                console.log('Storage Info:', storageInfo);
                console.log('All Data:', allData);
                console.log('localStorage Keys:', Object.keys(localStorage).filter(key => key.startsWith('shn_app_')));
                alert('Check console for detailed info');
              }}
              className="w-full bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
            >
              Log Detailed Info
            </button>
          </div>

          {/* Current Path */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm">
              <div className="font-medium">Current Path:</div>
              <div className="text-xs text-gray-600 break-all">
                {window.location.pathname}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
