import { useLocation } from "react-router-dom";
import AppRouter from "@/router/AppRouter";
import useElectronNavigation from "@/hooks/useElectronNavigation";
import Sidebar from "@/components/Sidebar";

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
      {showSidebar && <Sidebar />}
      <main className="flex-1 overflow-auto w-full">
        <AppRouter />
      </main>
    </div>
  );
}

export default App;
