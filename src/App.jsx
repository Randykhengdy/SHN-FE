import { useEffect } from "react";
import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAlert } from "@/hooks/useAlert";
import "@/lib/tokenDebug"; // Import debug utilities
import "@/lib/debugUtils"; // Import debug utilities

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();
  const { showAlert, AlertComponent } = useAlert();

  // Listen for global alert events from utility functions (like tokenUtils)
  useEffect(() => {
    const handleShowAlert = (event) => {
      const { title, message, type } = event.detail;
      showAlert(title, message, type);
    };

    window.addEventListener('showAlert', handleShowAlert);

    return () => {
      window.removeEventListener('showAlert', handleShowAlert);
    };
  }, [showAlert]);

  // Listen for alert events from Electron main process
  useEffect(() => {
    if (!window.electronAPI) return;

    const handleElectronAlert = (data) => {
      const { title, message, type } = data;
      showAlert(title, message, type);
    };

    window.electronAPI.onShowAlert(handleElectronAlert);

    return () => {
      // Note: IPC listeners are automatically cleaned up when component unmounts
    };
  }, [showAlert]);

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden">
        {/* Token Interceptor - Check token expiration */}
        <TokenInterceptor />
        
        {/* Global Alert Component */}
        <AlertComponent />
        
        {/* Main content - Full width without sidebar */}
        <main className="w-full h-full overflow-auto">
          <AppRouter />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
