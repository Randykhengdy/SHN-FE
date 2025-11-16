import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import Header from "@/components/Header";
import { dashboardService } from "@/services/dashboardService";
import { Input } from "@/components/ui/input";

function formatRupiah(num) {
  return "Rp " + (num || 0).toLocaleString("id-ID");
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Date range state - default to current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dateFrom, setDateFrom] = useState(formatDateForInput(startOfMonth));
  const [dateTo, setDateTo] = useState(formatDateForInput(endOfMonth));

  // General Dashboard Data from API
  const [generalDashboardData, setGeneralDashboardData] = useState({
    total_jumlah_po: 0,
    total_rupiah_po: 0,
    total_ar: 0,
    total_ap: 0
  });

  // Data from localStorage (for Recent Activity only)
  const poList = JSON.parse(localStorage.getItem("poList") || "[]");
  const apList = JSON.parse(localStorage.getItem("apList") || "[]");
  const invoiceList = JSON.parse(localStorage.getItem("invoiceList") || "[]");

  // Metrics from API
  const totalPO = generalDashboardData.total_jumlah_po || 0;
  const totalPembelian = generalDashboardData.total_rupiah_po || 0;
  const totalAR = generalDashboardData.total_ar || 0;
  const totalAP = generalDashboardData.total_ap || 0;

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
  const monthlyPurchaseRef = useRef(null);
  const monthlySalesRef = useRef(null);
  const monthlyWorkPlanningRef = useRef(null);
  const monthlyWorkActualRef = useRef(null);
  const materialDistRef = useRef(null);
  const inventoryStatusRef = useRef(null);
  const [monthlyPurchaseData, setMonthlyPurchaseData] = useState(null);
  const [monthlySalesData, setMonthlySalesData] = useState(null);
  const [monthlyWorkPlanningData, setMonthlyWorkPlanningData] = useState(null);
  const [monthlyWorkActualData, setMonthlyWorkActualData] = useState(null);

  useEffect(() => {
    initGeneralDashboard();
    initPurchaseOrderDashboard();
    initSalesOrderDashboard();
    initWorkOrderPlanningDashboard();
    initWorkOrderActualDashboard();
  }, [dateFrom, dateTo]);

  // Chart.js setup
  useEffect(() => {
    // Monthly Purchase Chart
    const monthlyPurchaseChart = new Chart(monthlyPurchaseRef.current, {
      type: "bar",
      data: {
        labels: monthlyPurchaseData?.map(item => item.day),
        datasets: [{
          label: "Penjualan (Juta Rupiah)",
          data: monthlyPurchaseData?.map(item => item.total),
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
              callback: value => value
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
    // Cleanup
    return () => {
      monthlyPurchaseChart.destroy();
    };
  }, [monthlyPurchaseData]);
    // Chart.js setup
  useEffect(() => {
    // Monthly Sales Chart
    const monthlySalesChart = new Chart(monthlySalesRef.current, {
      type: "bar",
      data: {
        labels: monthlySalesData?.map(item => item.day),
        datasets: [{
          label: "Penjualan (Juta Rupiah)",
          data: monthlySalesData?.map(item => item.total),
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
              callback: value => value
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
    // Cleanup
    return () => {
      monthlySalesChart.destroy();
    };
  }, [monthlySalesData]);
    // Chart.js setup
  useEffect(() => {
    // Monthly Work Order Planning Chart
    const monthlyWorkPlanningChart = new Chart(monthlyWorkPlanningRef.current, {
      type: "bar",
      data: {
        labels: monthlyWorkPlanningData?.map(item => item.day),
        datasets: [{
          label: "Penjualan (Juta Rupiah)",
          data: monthlyWorkPlanningData?.map(item => item.total),
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
              callback: value => value
            }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
    // Cleanup
    return () => {
      monthlyWorkPlanningChart.destroy();
    };
  }, [monthlyWorkPlanningData]);
    // Chart.js setup
  useEffect(() => {
    // Monthly Work Order Actual Chart
    const monthlyWorkActualChart = new Chart(monthlyWorkActualRef.current, {
      type: "bar",
      data: {
        labels: monthlyWorkActualData?.map(item => item.day),
        datasets: [{
          label: "Penjualan (Juta Rupiah)",
          data: monthlyWorkActualData?.map(item => item.total),
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
              callback: value => value
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
      monthlyWorkActualChart.destroy();
      materialDistChart.destroy();
      inventoryStatusChart.destroy();
    };
  }, [monthlyWorkActualData]);

  const initPurchaseOrderDashboard = async () => {
    try {
      const response = await dashboardService.getPurchaseOrderDashboard({
        date_from: dateFrom,
        date_to: dateTo
      });
      const data = response?.data || response || [];
      explodeDataToDaysInMonth(data, setMonthlyPurchaseData, dateFrom, dateTo);
    } catch (error) {
      console.error("Error fetching purchase order dashboard:", error);
      setMonthlyPurchaseData([]);
    }
  }
  const initSalesOrderDashboard = async () => {
    try {
      const response = await dashboardService.getSalesOrderDashboard({
        date_from: dateFrom,
        date_to: dateTo
      });
      const data = response?.data || response || [];
      explodeDataToDaysInMonth(data, setMonthlySalesData, dateFrom, dateTo);
    } catch (error) {
      console.error("Error fetching sales order dashboard:", error);
      setMonthlySalesData([]);
    }
  }

  const initWorkOrderPlanningDashboard = async () => {
    try {
      const response = await dashboardService.getWorkOrderPlanningDashboard({
        date_from: dateFrom,
        date_to: dateTo
      });
      const data = response?.data || response || [];
      explodeDataToDaysInMonth(data, setMonthlyWorkPlanningData, dateFrom, dateTo);
    } catch (error) {
      console.error("Error fetching work order planning dashboard:", error);
      setMonthlyWorkPlanningData([]);
    }
  }

  const initWorkOrderActualDashboard = async () => {
    try {
      const response = await dashboardService.getWorkOrderActualDashboard({
        date_from: dateFrom,
        date_to: dateTo
      });
      const data = response?.data || response || [];
      explodeDataToDaysInMonth(data, setMonthlyWorkActualData, dateFrom, dateTo);
    } catch (error) {
      console.error("Error fetching work order actual dashboard:", error);
      setMonthlyWorkActualData([]);
    }
  }

  const initGeneralDashboard = async () => {
    try {
      const response = await dashboardService.getGeneralDashboard({
        date_from: dateFrom,
        date_to: dateTo
      });
      if (response && response.data) {
        setGeneralDashboardData(response.data);
      }
    } catch (error) {
      console.error("Error fetching general dashboard:", error);
      // Set default values on error
      setGeneralDashboardData({
        total_jumlah_po: 0,
        total_rupiah_po: 0,
        total_ar: 0,
        total_ap: 0
      });
    }
  }

  const formatDateRange = (dateFromStr, dateToStr) => {
    const fromDate = new Date(dateFromStr);
    const toDate = new Date(dateToStr);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    };
    
    // Check if same month and year
    if (fromDate.getMonth() === toDate.getMonth() && 
        fromDate.getFullYear() === toDate.getFullYear()) {
      return `${fromDate.getDate()} - ${toDate.getDate()} ${toDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    }
    
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
  };

  const explodeDataToDaysInMonth = (data, setData, dateFromStr, dateToStr) => {
    const fromDate = new Date(dateFromStr);
    const toDate = new Date(dateToStr);
    
    // Check if range spans multiple months
    const isMultiMonth = fromDate.getMonth() !== toDate.getMonth() || 
                         fromDate.getFullYear() !== toDate.getFullYear();
    
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.warn("explodeDataToDaysInMonth: data is not an array", data);
      setData([]);
      return;
    }
    
    // Create a map using date string as key (YYYY-MM-DD format)
    const map = {};
    data.forEach(item => {
      // Parse the backend data: year, month (name), day
      // Create a date string key
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.findIndex(m => m === item.month);
      if (monthIndex !== -1) {
        const dateKey = `${item.year}-${String(monthIndex + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
        map[dateKey] = item.total;
      }
    });
    
    // Generate chart data for all days in the range
    const chartData = [];
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayNum = currentDate.getDate();
      
      // Create label: show day only for single month, or DD/MM for multi-month
      const label = isMultiMonth 
        ? `${String(dayNum).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        : dayNum;
      
      chartData.push({
        day: label,
        total: map[dateKey] ?? 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setData(chartData);
  }

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
      <div className="h-screen flex overflow-scroll">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="mb-4 text-lg font-semibold text-gray-700">
            Selamat datang di Sistem Inventory & Workshop SURYA LOGAM JAYA
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-end gap-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-1">Total PO</div>
              <div className="text-2xl font-bold text-gray-800">{totalPO}</div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-1">Total Rupiah PO</div>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Pembelian {formatDateRange(dateFrom, dateTo)}</h3>
              <div className="relative h-56">
                <canvas ref={monthlyPurchaseRef}></canvas>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Penjualan {formatDateRange(dateFrom, dateTo)}</h3>
              <div className="relative h-56">
                <canvas ref={monthlySalesRef}></canvas>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Pengerjaan Planning {formatDateRange(dateFrom, dateTo)}</h3>
              <div className="relative h-56">
                <canvas ref={monthlyWorkPlanningRef}></canvas>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Pengerjaan Actual {formatDateRange(dateFrom, dateTo)}</h3>
              <div className="relative h-56">
                <canvas ref={monthlyWorkActualRef}></canvas>
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


    </div>
  );
}
