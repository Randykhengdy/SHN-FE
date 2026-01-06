import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  ShoppingCart, 
  FileText, 
  Users, 
  Settings, 
  CheckSquare,
  Warehouse,
  Wrench,
  ClipboardList,
  Edit3,
  Activity
} from "lucide-react";

export default function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: Home,
      category: "main"
    },
    {
      label: "Sales Order",
      path: "/sales-order",
      icon: FileText,
      category: "transaksi"
    },
    {
      label: "Purchase Order",
      path: "/purchase-order",
      icon: ShoppingCart,
      category: "transaksi"
    },
    {
      label: "Work Order",
      path: "/work-order",
      icon: Wrench,
      category: "transaksi"
    },
    {
      label: "WO Actual",
      path: "/wo-actual",
      icon: Activity,
      category: "transaksi"
    },
    {
      label: "Canvas Testing",
      path: "/canvas-testing",
      icon: Edit3,
      category: "testing"
    },
    {
      label: "Approval",
      path: "/approval",
      icon: CheckSquare,
      category: "transaksi"
    },
    {
      label: "Financial Report",
      path: "/financial-report",
      icon: TrendingUp,
      category: "transaksi"
    },
    {
      label: "Workshop",
      path: "/workshop",
      icon: Wrench,
      category: "transaksi"
    },
    {
      label: "Master Data",
      path: "/masterdata/jenis-barang",
      icon: Settings,
      category: "master"
    },
    {
      label: "Users",
      path: "/users",
      icon: Users,
      category: "admin"
    },
    // Laporan items
    {
      label: "WO Planning Report",
      path: "/laporan/work-order-planning",
      icon: ClipboardList,
      category: "laporan"
    },
    {
      label: "WO Actual Report",
      path: "/laporan/work-order-actual",
      icon: ClipboardList,
      category: "laporan"
    }
  ];

  const isActive = (path) => {
    if (path === "/work-order") {
      return location.pathname === "/work-order" || 
             location.pathname.startsWith("/work-order/");
    }
    if (path === "/wo-actual") {
      return location.pathname === "/wo-actual" || 
             location.pathname.startsWith("/wo-actual/");
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getCategoryItems = (category) => {
    return menuItems.filter(item => item.category === category);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex flex-wrap gap-2">
        {/* Main Menu */}
        {getCategoryItems("main").map((item) => (
          <Button
            key={item.path}
            variant={isActive(item.path) ? "default" : "ghost"}
            size="sm"
            onClick={() => navigate(item.path)}
            className="flex items-center gap-2"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Button>
        ))}

        {false && (
          <>
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            {/* Laporan Menu */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-500 mr-2">LAPORAN:</span>
              {getCategoryItems("laporan").map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
          </>
        )}

        {/* Transaksi Menu */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 mr-2">TRANSAKSI:</span>
          {getCategoryItems("transaksi").map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* Master Data Menu */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 mr-2">MASTER DATA:</span>
          {getCategoryItems("master").map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>

        {/* Admin Menu */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 mr-2">ADMIN:</span>
          {getCategoryItems("admin").map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="flex items-center gap-2"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
