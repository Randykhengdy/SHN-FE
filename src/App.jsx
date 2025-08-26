import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/lib/tokenDebug"; // Import debug utilities

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden">
        {/* Token Interceptor - Check token expiration */}
        <TokenInterceptor />
        
        {/* Main content - Full width without sidebar */}
        <main className="w-full h-full overflow-auto">
          <AppRouter />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
