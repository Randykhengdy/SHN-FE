import React from "react";
import Header from "./Header";

export default function SalesOrderLayout({ children, title, subtitle = "TRANSAKSI" }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
            {subtitle}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
