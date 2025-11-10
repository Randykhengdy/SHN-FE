import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { useAlert } from "@/hooks/useAlert";
import apiConfig, { API_ENDPOINTS } from "@/config/api";
import { getAuthHeader } from "@/api/GetAuthHeader";
import { checkAndRefreshToken } from "@/lib/tokenUtils";
import { getPelangganOptions, getGudangOptions } from "@/services/masterDataService";
// XLSX akan di-load secara dinamis saat diperlukan agar tidak error jika belum terpasang

export default function SalesOrderAdvancedReportPage() {
  const { showAlert } = useAlert();
  
  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    tanggal_mulai: "",
    tanggal_akhir: "",
    pelanggan_id: "",
    gudang_id: "",
    min_total: "",
    max_total: "",
    sort: "tanggal_so,desc"
  });
  
  // Options for dropdowns
  const [pelangganOptions, setPelangganOptions] = useState([]);
  const [gudangOptions, setGudangOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Status options
  const statusOptions = [
    { value: "all", label: "Semua Status" },
    { value: "active", label: "Active" },
    { value: "delete_requested", label: "Delete Requested" },
    { value: "deleted", label: "Deleted" }
  ];

  // Sort options
  const sortOptions = [
    { value: "tanggal_so,desc", label: "Tanggal SO (Terbaru)" },
    { value: "tanggal_so,asc", label: "Tanggal SO (Terlama)" },
    { value: "nomor_so,asc", label: "Nomor SO (A-Z)" },
    { value: "nomor_so,desc", label: "Nomor SO (Z-A)" },
    { value: "total_harga_so,desc", label: "Total Harga (Tertinggi)" },
    { value: "total_harga_so,asc", label: "Total Harga (Terendah)" }
  ];

  // Load dropdown options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoadingOptions(true);
        const [pelangganData, gudangData] = await Promise.all([
          getPelangganOptions(),
          getGudangOptions()
        ]);
        
        setPelangganOptions([
          { value: "all", label: "Semua Pelanggan" },
          ...pelangganData
        ]);
        
        setGudangOptions([
          { value: "all", label: "Semua Gudang" },
          ...gudangData
        ]);
      } catch (error) {
        console.error("Error loading options:", error);
        showAlert("Error loading dropdown options", "error");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    loadOptions();
  }, [showAlert]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Parse currency input (keep numeric only)
  const parseCurrency = (value) => {
    if (!value) return "";
    return value.replace(/[^\d]/g, "");
  };

  // Generate Excel report
  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      
      // Refresh token if needed
      await checkAndRefreshToken();
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.status && filters.status !== "all") queryParams.append("status", filters.status);
      if (filters.tanggal_mulai) {
        queryParams.append("tanggal_mulai", filters.tanggal_mulai);
      }
      if (filters.tanggal_akhir) {
        queryParams.append("tanggal_akhir", filters.tanggal_akhir);
      }
      if (filters.pelanggan_id && filters.pelanggan_id !== "all") queryParams.append("pelanggan_id", filters.pelanggan_id);
      if (filters.gudang_id && filters.gudang_id !== "all") queryParams.append("gudang_id", filters.gudang_id);
      if (filters.min_total) queryParams.append("min_total", parseCurrency(filters.min_total));
      if (filters.max_total) queryParams.append("max_total", parseCurrency(filters.max_total));
      if (filters.sort) queryParams.append("sort", filters.sort);
      
      // Set high per_page for comprehensive report
      queryParams.append("per_page", "10000");
      
      const url = `${apiConfig.baseUrl}${API_ENDPOINTS.salesOrder}/report${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      
      console.log("Generating report from URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getAuthHeader(),
          "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json"
        }
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const contentType = response.headers.get("content-type") || "";
      const isExcel = contentType.includes("spreadsheet") || contentType.includes("excel") || contentType.includes("octet-stream");
      const isJson = contentType.includes("application/json");

      // Generate filename with timestamp and filter info
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      let filename = `sales-order-report_${timestamp}`;
      if (filters.tanggal_mulai && filters.tanggal_akhir) {
        const startDate = filters.tanggal_mulai.replaceAll("-", "");
        const endDate = filters.tanggal_akhir.replaceAll("-", "");
        filename += `_${startDate}-${endDate}`;
      }
      if (filters.status) {
        filename += `_${filters.status}`;
      }

      if (isExcel) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${filename}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        showAlert("Unduhan dimulai", "File Excel sedang diunduh", "info");
      } else if (isJson) {
        // Server balas JSON; bangun workbook XLSX di client (lazy import)
        const json = await response.json();
        if (!window.XLSX) {
          try {
            const mod = await import(/* @vite-ignore */ 'xlsx');
            window.XLSX = mod;
          } catch (e) {
            throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
          }
        }
        const wb = buildWorkbookFromAdvanced(json);
        const wbout = window.XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${filename}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        showAlert("Unduhan dimulai", "Laporan XLSX sedang diunduh", "info");
      } else {
        const text = await response.text();
        console.error("Unexpected response type:", contentType, text);
        throw new Error("Server tidak mengembalikan file yang dapat diunduh");
      }
      
    } catch (error) {
      console.error("Error generating report:", error);
      showAlert(`Gagal generate laporan: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Builder workbook XLSX dari JSON (advanced)
  const buildWorkbookFromAdvanced = (json) => {
    const rows = Array.isArray(json?.data) ? json.data : [];
    const summary = json?.summary || {};
    const formatDate = (s) => (s ? String(s).slice(0, 10) : "");

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

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(dataRows);
    XLSX.utils.book_append_sheet(wb, wsData, "Data");

    const summaryAoA = [
      ["Ringkasan", "Nilai"],
      ["Total Orders", summary?.orders_count ?? ""],
      ["Total Items", summary?.items_count ?? ""],
      ["Subtotal Sum", summary?.subtotal_sum ?? ""],
      ["Total Diskon Sum", summary?.total_diskon_sum ?? ""],
      ["PPN Amount Sum", summary?.ppn_amount_sum ?? ""],
      ["Total Amount Sum", summary?.total_amount_sum ?? ""],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    return wb;
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "",
      tanggal_mulai: "",
      tanggal_akhir: "",
      pelanggan_id: "",
      gudang_id: "",
      min_total: "",
      max_total: "",
      sort: "tanggal_so,desc"
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan Sales Order</h1>
          <p className="text-muted-foreground">
            Generate laporan Sales Order dengan berbagai filter dan opsi
          </p>
        </div>
        <FileSpreadsheet className="h-8 w-8 text-green-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Nomor SO / Syarat Pembayaran</Label>
              <Input
                id="search"
                placeholder="Masukkan nomor SO atau syarat pembayaran..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status..." />
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
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
              <Input
                id="tanggal_mulai"
                type="date"
                value={filters.tanggal_mulai}
                onChange={(e) => handleFilterChange("tanggal_mulai", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggal_akhir">Tanggal Akhir</Label>
              <Input
                id="tanggal_akhir"
                type="date"
                value={filters.tanggal_akhir}
                onChange={(e) => handleFilterChange("tanggal_akhir", e.target.value)}
              />
            </div>
          </div>

          {/* Pelanggan and Gudang Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pelanggan">Pelanggan</Label>
              <Select
                value={filters.pelanggan_id}
                onValueChange={(value) => handleFilterChange("pelanggan_id", value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Pilih pelanggan..."} />
                </SelectTrigger>
                <SelectContent>
                  {pelangganOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gudang">Gudang</Label>
              <Select
                value={filters.gudang_id}
                onValueChange={(value) => handleFilterChange("gudang_id", value)}
                disabled={isLoadingOptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingOptions ? "Loading..." : "Pilih gudang..."} />
                </SelectTrigger>
                <SelectContent>
                  {gudangOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Range Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_total">Total Minimal</Label>
              <Input
                id="min_total"
                placeholder="Contoh: 1000000"
                value={filters.min_total}
                onChange={(e) => {
                  const value = parseCurrency(e.target.value);
                  handleFilterChange("min_total", value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_total">Total Maksimal</Label>
              <Input
                id="max_total"
                placeholder="Contoh: 10000000"
                value={filters.max_total}
                onChange={(e) => {
                  const value = parseCurrency(e.target.value);
                  handleFilterChange("max_total", value);
                }}
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label htmlFor="sort">Urutan Data</Label>
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange("sort", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih urutan..." />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading || isLoadingOptions}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Excel Report
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Reset Filter
            </Button>
          </div>

          {/* Filter Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Filter yang Aktif:</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              {filters.search && <div>• Pencarian: "{filters.search}"</div>}
              {filters.status && <div>• Status: {statusOptions.find(s => s.value === filters.status)?.label}</div>}
              {filters.tanggal_mulai && <div>• Tanggal Mulai: {filters.tanggal_mulai}</div>}
              {filters.tanggal_akhir && <div>• Tanggal Akhir: {filters.tanggal_akhir}</div>}
              {filters.pelanggan_id && <div>• Pelanggan: {pelangganOptions.find(p => p.value === filters.pelanggan_id)?.label}</div>}
              {filters.gudang_id && <div>• Gudang: {gudangOptions.find(g => g.value === filters.gudang_id)?.label}</div>}
              {filters.min_total && <div>• Total Minimal: {formatCurrency(filters.min_total)}</div>}
              {filters.max_total && <div>• Total Maksimal: {formatCurrency(filters.max_total)}</div>}
              {!filters.search && !filters.status && !filters.tanggal_mulai && !filters.tanggal_akhir && 
               !filters.pelanggan_id && !filters.gudang_id && !filters.min_total && !filters.max_total && (
                <div className="text-muted-foreground">Tidak ada filter aktif - akan menampilkan semua data</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}