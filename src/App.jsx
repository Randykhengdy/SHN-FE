import { useEffect, useState } from "react";
import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAlert } from "@/hooks/useAlert";
import "@/lib/tokenDebug"; // Import debug utilities
import "@/lib/debugUtils"; // Import debug utilities
import { AppProvider } from "@/context/AppContext";
import ChangePasswordModal from "@/components/ChangePasswordModal";

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();
  const { showAlert, AlertComponent } = useAlert();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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

    // Listen for Change Password Modal event
    if (window.electronAPI.onChangePassword) {
      window.electronAPI.onChangePassword(() => {
        setIsChangePasswordOpen(true);
      });
    }

    return () => {
      // Note: IPC listeners are automatically cleaned up when component unmounts
    };
  }, [showAlert]);

  return (
    <ErrorBoundary>
      <AppProvider>
        <div className="h-screen w-screen overflow-hidden">
          {/* Token Interceptor - Check token expiration */}
          <TokenInterceptor />
          
          {/* Global Alert Component */}
          <AlertComponent />
          
          {/* Global Change Password Modal */}
          <ChangePasswordModal 
            isOpen={isChangePasswordOpen} 
            onClose={() => setIsChangePasswordOpen(false)} 
          />

          {/* Main content - Full width without sidebar */}
          <main className="w-full h-full overflow-auto">
            <AppRouter />
          </main>
        </div>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
