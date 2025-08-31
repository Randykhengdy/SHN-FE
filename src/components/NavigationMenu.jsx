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
  Wrench
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
      path: "/input-po",
      icon: ShoppingCart,
      category: "transaksi"
    },
    {
      label: "Approval",
      path: "/approval",
      icon: CheckSquare,
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
    }
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    if (path === "/masterdata/jenis-barang") {
      return location.pathname.startsWith("/masterdata");
    }
    if (path === "/sales-order") {
      return location.pathname.startsWith("/sales-order");
    }
    return location.pathname === path;
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

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300 mx-2"></div>

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
