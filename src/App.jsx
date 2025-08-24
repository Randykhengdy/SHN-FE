import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import TokenInterceptor from "@/components/TokenInterceptor";

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Token Interceptor - Check token expiration */}
      <TokenInterceptor />
      
      {/* Main content - Full width without sidebar */}
      <main className="w-full h-full overflow-auto">
        <AppRouter />
      </main>
    </div>
  );
}

export default App;
