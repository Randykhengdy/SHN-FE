import { useLocation } from "react-router-dom";
import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import Sidebar from "@/components/Sidebar";
import DevTools from "@/components/DevTools";
import TokenInterceptor from "@/components/TokenInterceptor";

function App() {
  // Gunakan hook untuk menangani navigasi dari Electron
  useElectronNavigation();
  
  // Cek apakah user sudah login
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "1";
  const location = useLocation();
  
  // Halaman yang tidak memerlukan sidebar
  const noSidebarPages = ["/", "/login", "/register"];
  const showSidebar = isLoggedIn && !noSidebarPages.includes(location.pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Token Interceptor - Check token expiration */}
      <TokenInterceptor />
      
      {/* {showSidebar && <Sidebar />} */}
      <main className={`overflow-auto ${showSidebar ? 'flex-1' : 'w-full'}`}>
        <AppRouter />
      </main>
      
      {/* Development Tools - Always available */}
      {/* <DevTools /> */}
    </div>
  );
}

export default App;
