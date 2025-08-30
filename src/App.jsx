import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";
import ErrorBoundary from "@/components/ErrorBoundary";
import DevTools from "@/components/DevTools";
import "@/lib/tokenDebug"; // Import debug utilities

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen overflow-hidden">
        {/* Token Interceptor - Check token expiration */}
        <TokenInterceptor />
        
        {/* Dev Tools - Only in development */}
        <DevTools />
        
        {/* Main content - Full width without sidebar */}
        <main className="w-full h-full overflow-auto">
          <AppRouter />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
