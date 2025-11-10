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
import { Download, FileSpreadsheet } from "lucide-react";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "IN_PROGRESS", label: "IN_PROGRESS" },
  { value: "COMPLETED", label: "COMPLETED" },
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" },
];

export default function WorkOrderPlanningReportPage() {
  const { showAlert, AlertComponent } = useAlert();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  const pad = (n) => String(n).padStart(2, "0");
  const formatDateLocal = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const getPeriodRange = (period) => {
    const now = new Date();
    let start = null; let end = null;
    switch (period) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week": {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "quarter": {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStartMonth, 1);
        end = new Date(now.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return null;
    }
    return {
      tanggal_wo_start: formatDateLocal(start),
      tanggal_wo_end: formatDateLocal(end),
    };
  };

  const buildWorkbookFromPlanning = (json) => {
    const rows = Array.isArray(json?.data) ? json.data : [];
    const formatDate = (s) => (s ? String(s).slice(0, 10) : "");
    const dataRows = rows.map((r) => ({
      "Nomor WO": r?.nomor_wo ?? "",
      "Tanggal WO": formatDate(r?.tanggal_wo),
      "Status": r?.status ?? "",
      "Prioritas": r?.prioritas ?? "",
      "Nomor SO": r?.nomor_so ?? "",
      "Pelanggan": r?.nama_pelanggan ?? "",
      "Gudang": r?.nama_gudang ?? "",
      "Handover Method": r?.handover_method ?? "",
    }));

    const wb = window.XLSX.utils.book_new();
    const wsData = window.XLSX.utils.json_to_sheet(dataRows);
    window.XLSX.utils.book_append_sheet(wb, wsData, "Data");
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
          queryParams.append("tanggal_wo_start", range.tanggal_wo_start);
          queryParams.append("tanggal_wo_end", range.tanggal_wo_end);
        }
      }
      const url = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderPlanning}/report${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getAuthHeader(),
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json",
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
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `wo-planning-report_${timestamp}.xlsx`;
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        showAlert("Unduhan dimulai", "File Excel sedang diunduh", "info");
      } else if (isJson) {
        const json = await response.json();
        if (!window.XLSX) {
          try {
            const mod = await import(/* @vite-ignore */ 'xlsx');
            window.XLSX = mod;
          } catch (e) {
            throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
          }
        }
        const wb = buildWorkbookFromPlanning(json);
        const wbout = window.XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `wo-planning-report_${timestamp}.xlsx`;
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
      console.error("Error exporting WO Planning:", error);
      showAlert("Error", `Gagal export WO Planning: ${error.message || error}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPeriodFilter("all");
  };

  return (
    <PageLayout title="Laporan Work Order Planning" category="LAPORAN">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan Work Order Planning</h1>
          <p className="text-muted-foreground">Generate laporan WO Planning dengan filter sederhana</p>
        </div>
        <FileSpreadsheet className="h-7 w-7 text-green-600" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Cari (Nomor WO / SO / Pelanggan)</label>
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Contoh: WO-2025-0001" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm">Periode</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger><SelectValue placeholder="Pilih periode" /></SelectTrigger>
                <SelectContent>
                  {periodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Menyiapkan…" : "Export Excel"}
            </Button>
            <Button variant="outline" onClick={handleReset}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      <AlertComponent />
    </PageLayout>
  );
}