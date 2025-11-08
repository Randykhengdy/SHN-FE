import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageLayout from "@/components/PageLayout";
import apiConfig, { API_ENDPOINTS } from "@/config/api";
import { getAuthHeader } from "@/api/GetAuthHeader";
import { checkAndRefreshToken } from "@/lib/tokenUtils";
import { useAlert } from "@/hooks/useAlert";
import { Download } from "lucide-react";
// XLSX akan di-load secara dinamis saat diperlukan agar tidak error jika belum terpasang

// Selaraskan dengan API report dan gunakan sentinel 'all' untuk opsi "Semua"
const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Active" },
  { value: "delete_requested", label: "Delete Requested" },
  { value: "deleted", label: "Deleted" }
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" }
];

export default function SalesOrderReportPage() {
  const { showAlert, AlertComponent } = useAlert();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const pad = (n) => String(n).padStart(2, "0");
  const formatDateLocal = (date) => {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}-${m}-${d}`;
  };

  const getPeriodRange = (period) => {
    const now = new Date();
    let start = null;
    let end = null;

    switch (period) {
      case "today": {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }
      case "week": {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7; // convert Sunday(0) -> 6
        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
      case "quarter": {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStartMonth, 1);
        end = new Date(now.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case "year": {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      }
      default:
        return null;
    }

    return {
      tanggal_mulai: formatDateLocal(start),
      tanggal_akhir: formatDateLocal(end)
    };
  };

  // Bangun workbook XLSX dari JSON menggunakan SheetJS (lazy import)
  const buildWorkbookFromJson = (json) => {
    const rows = Array.isArray(json?.data) ? json.data : [];
    const summary = json?.summary || {};

    const formatDate = (s) => {
      if (!s) return "";
      return String(s).slice(0, 10);
    };

    const dataRows = rows.map((r) => ({
      "Nomor SO": r?.nomor_so ?? "",
      "Tanggal SO": formatDate(r?.tanggal_so),
      "Tanggal Pengiriman": formatDate(r?.tanggal_pengiriman),
      "Status": r?.status || "-",
      "Pelanggan": r?.pelanggan?.nama_pelanggan ?? "",
      "Gudang": r?.gudang?.nama_gudang ?? "",
      "Subtotal": r?.subtotal ?? "",
      "Total Diskon": r?.total_diskon ?? "",
      "PPN Amount": r?.ppn_amount ?? "",
      "Total Harga SO": r?.total_harga_so ?? "",
      "Jumlah Item": r?.items_count ?? "",
    }));

    const wb = window.XLSX.utils.book_new();
    const wsData = window.XLSX.utils.json_to_sheet(dataRows);
    window.XLSX.utils.book_append_sheet(wb, wsData, "Data");

    const summaryAoA = [
      ["Ringkasan", "Nilai"],
      ["Total Orders", summary?.orders_count ?? ""],
      ["Total Items", summary?.items_count ?? ""],
      ["Subtotal Sum", summary?.subtotal_sum ?? ""],
      ["Total Diskon Sum", summary?.total_diskon_sum ?? ""],
      ["PPN Amount Sum", summary?.ppn_amount_sum ?? ""],
      ["Total Amount Sum", summary?.total_amount_sum ?? ""],
    ];
    const wsSummary = window.XLSX.utils.aoa_to_sheet(summaryAoA);
    window.XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    return wb;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await checkAndRefreshToken();

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") queryParams.append("status", statusFilter);
      if (periodFilter && periodFilter !== "all") {
        const range = getPeriodRange(periodFilter);
        if (range) {
          queryParams.append("tanggal_mulai", range.tanggal_mulai);
          queryParams.append("tanggal_akhir", range.tanggal_akhir);
        }
      }

      // Saat search kosong, tetap ambil semua dengan per_page besar
      queryParams.append("per_page", "10000");

      const url = `${apiConfig.baseUrl}${API_ENDPOINTS.salesOrder}/report${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getAuthHeader(),
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json"
        },
      });

      if (!response.ok) {
        const ct = response.headers.get("Content-Type") || response.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.message || `Export failed (HTTP ${response.status})`);
        } else {
          const text = await response.text();
          throw new Error(text || `Export failed (HTTP ${response.status})`);
        }
      }

      const contentType = response.headers.get("Content-Type") || response.headers.get("content-type") || "";
      const isExcel = contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("octet-stream");
      const isJson = contentType.includes("application/json");
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

      if (isExcel) {
        // Unduh langsung file .xlsx dari server
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `sales-order-report_${timestamp}.xlsx`;

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

        showAlert("Unduhan dimulai", "File Excel sedang diunduh", "info");
      } else if (isJson) {
        // Server balas JSON → bangun workbook XLSX di client (lazy import)
        const json = await response.json();
        if (!window.XLSX) {
          try {
            const mod = await import(/* @vite-ignore */ 'xlsx');
            window.XLSX = mod;
          } catch (e) {
            throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
          }
        }
        const wb = buildWorkbookFromJson(json);
        const wbout = window.XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `sales-order-report_${timestamp}.xlsx`;

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

        showAlert("Unduhan dimulai", "Laporan XLSX sedang diunduh", "info");
      } else {
        const text = await response.text();
        throw new Error(text || "Server tidak mengembalikan file yang dapat diunduh");
      }
    } catch (error) {
      console.error("Error exporting sales orders:", error);
      showAlert("Error", `Gagal export Sales Order: ${error.message || error}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPeriodFilter("all");
  };

  return (
    <PageLayout title="Laporan Sales Order" category="LAPORAN">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Generate Laporan Sales Order (Excel)</h2>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Parameter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cari SO</label>
              <Input
                placeholder="Cari berdasarkan No SO, nama pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Periode</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700">
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert container */}
      <AlertComponent />
    </PageLayout>
  );
}