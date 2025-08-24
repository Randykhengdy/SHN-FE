import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Header from "@/components/Header";

function formatRupiah(num) {
  return "Rp " + (num || 0).toLocaleString("id-ID");
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Data from localStorage
  const poList = JSON.parse(localStorage.getItem("poList") || "[]");
  const apList = JSON.parse(localStorage.getItem("apList") || "[]");
  const invoiceList = JSON.parse(localStorage.getItem("invoiceList") || "[]");

  // Metrics
  const totalPO = poList.length;
  const totalPembelian = apList.reduce((sum, ap) => sum + (ap.total || ap.nominal || 0), 0);
  const totalAR = invoiceList.reduce((sum, inv) => {
    const pembayaran = (inv.pembayaran || []).reduce((a, b) => a + b, 0);
    const sisa = (inv.total || 0) - pembayaran;
    return sisa > 0 ? sum + sisa : sum;
  }, 0);
  const totalAP = apList.reduce((sum, ap) => sum + (ap.total || ap.nominal || 0), 0);

  // Recent Activity
  let activities = [];
  poList.forEach(po => {
    activities.push({
      date: po.tanggal || po.date || po.createdAt || "-",
      text: `PO baru: <b>${po.noPO || "-"}</b> (${po.jenis || ""})`
    });
  });
  apList.forEach(ap => {
    activities.push({
      date: ap.tanggal || "-",
      text: `Pembelian plat: <b>${ap.vendor || "-"}</b> (${formatRupiah(ap.total || ap.nominal)})`
    });
  });
  invoiceList.forEach(inv => {
    activities.push({
      date: inv.tanggal || "-",
      text: `Invoice: <b>${inv.noInvoice || "-"}</b> (Total ${formatRupiah(inv.total)})`
    });
  });
  activities = activities
    .filter(a => a.date && a.date !== "-")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  // Chart refs
  const monthlySalesRef = useRef(null);
  const materialDistRef = useRef(null);
  const inventoryStatusRef = useRef(null);

  // Chart.js setup
  useEffect(() => {
    // Monthly Sales Chart
    const monthlySalesChart = new Chart(monthlySalesRef.current, {
      type: "bar",
      data: {
        labels: [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [{
          label: "Penjualan (Juta Rupiah)",
          data: [12.5, 15.2, 18.7, 14.3, 22.1, 19.8, 25.4, 21.6, 28.9, 24.3, 31.2, 27.8],
          backgroundColor: "rgba(44, 62, 80, 0.8)",
          borderColor: "rgba(44, 62, 80, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => "Rp " + value + "M"
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });

    // Material Distribution Chart
    const materialDistChart = new Chart(materialDistRef.current, {
      type: "pie",
      data: {
        labels: ["Aluminium", "Copper", "Bronze", "Steel", "Other"],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            "rgba(44, 62, 80, 0.8)",
            "rgba(231, 76, 60, 0.8)",
            "rgba(241, 196, 15, 0.8)",
            "rgba(46, 204, 113, 0.8)",
            "rgba(155, 89, 182, 0.8)"
          ],
          borderWidth: 2,
          borderColor: "#fff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });

    // Inventory Status Chart
    const inventoryStatusChart = new Chart(inventoryStatusRef.current, {
      type: "doughnut",
      data: {
        labels: ["Tersedia", "Low Stock", "Habis"],
        datasets: [{
          data: [65, 25, 10],
          backgroundColor: [
            "rgba(46, 204, 113, 0.8)",
            "rgba(241, 196, 15, 0.8)",
            "rgba(231, 76, 60, 0.8)"
          ],
          borderWidth: 2,
          borderColor: "#fff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });

    // Cleanup
    return () => {
      monthlySalesChart.destroy();
      materialDistChart.destroy();
      inventoryStatusChart.destroy();
    };
  }, []);

  // Logout confirmation modal sudah tidak diperlukan karena ada di Header

  // Dummy low stock items (replace with your own logic if needed)
  const lowStockItems = [
    { name: "Aluminium 6061", sisa: "25kg", min: "50kg", status: "Kritis", color: "#e74c3c", bgColor: "bg-red-50" },
    { name: "Copper C110", sisa: "80kg", min: "100kg", status: "Rendah", color: "#f39c12", bgColor: "bg-yellow-50" },
    { name: "Bronze C93200", sisa: "15kg", min: "30kg", status: "Kritis", color: "#e74c3c", bgColor: "bg-red-50" },
    { name: "Steel A36", sisa: "120kg", min: "150kg", status: "Rendah", color: "#f39c12", bgColor: "bg-yellow-50" },
    { name: "Titanium Grade 2", sisa: "8kg", min: "20kg", status: "Kritis", color: "#e74c3c", bgColor: "bg-red-50" }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <Header />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="mb-7 text-lg font-semibold text-gray-700">
          Selamat datang di Sistem Inventory & Workshop SURYA LOGAM JAYA
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Total PO</div>
            <div className="text-2xl font-bold text-gray-800">{totalPO}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Total Pembelian Plat</div>
            <div className="text-2xl font-bold text-gray-800">{formatRupiah(totalPembelian)}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Total AR (Piutang)</div>
            <div className="text-2xl font-bold text-gray-800">{formatRupiah(totalAR)}</div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Total AP (Hutang)</div>
            <div className="text-2xl font-bold text-gray-800">{formatRupiah(totalAP)}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Penjualan Bulanan (2025)</h3>
            <div className="relative h-56">
              <canvas ref={monthlySalesRef}></canvas>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Distribusi Material</h3>
            <div className="relative h-56">
              <canvas ref={materialDistRef}></canvas>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Statistik Produksi</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="border border-gray-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">156</div>
                <div className="text-sm text-gray-500">Total Produksi</div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">89%</div>
                <div className="text-sm text-gray-500">Efisiensi</div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">12</div>
                <div className="text-sm text-gray-500">Proyek Aktif</div>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">2.4</div>
                <div className="text-sm text-gray-500">Rata-rata Hari</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Status Inventory</h3>
            <div className="relative h-56">
              <canvas ref={inventoryStatusRef}></canvas>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center mb-4 text-lg font-semibold text-gray-700">
              <span className="text-red-500 mr-2">⚠️</span>
              Stok Menipis
            </div>
            <div className="space-y-2">
              {lowStockItems.map((item, idx) => (
                <div key={idx} className={`flex items-center p-3 ${item.bgColor} rounded-lg border-l-4`} style={{ borderLeftColor: item.color }}>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    <div className="text-sm text-gray-600">Sisa: {item.sisa}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: item.color }}>{item.status}</div>
                    <div className="text-sm text-gray-600">Min: {item.min}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="text-lg font-semibold text-gray-700 mb-4">
              Aktivitas Terbaru
            </div>
            <ul className="space-y-2">
              {activities.length === 0 ? (
                <li>Tidak ada aktivitas terbaru.</li>
              ) : (
                activities.map((act, idx) => (
                  <li key={idx} className="mb-2">
                    <span className="text-gray-500 text-sm">{act.date}</span>
                    {" — "}
                    <span dangerouslySetInnerHTML={{ __html: act.text }} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>


    </div>
  );
}
