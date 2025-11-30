import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Download, FileText, Eye, Trash2, ArrowRight, Calendar, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { purchaseOrderService } from "@/services/purchaseOrderService";
import apiConfig, { API_ENDPOINTS } from "@/config/api";
import { getAuthHeader } from "@/api/GetAuthHeader";
import { checkAndRefreshToken } from "@/lib/tokenUtils";
import { useAlert } from "@/hooks/useAlert";
import { isAdmin } from "@/lib/utils";
import CustomAlert from "@/components/modals/CustomAlert";
import PageLayout from "@/components/PageLayout";
import { useAppContext } from "@/context/AppContext";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "received", label: "Received" },
  { value: "paid", label: "Paid" }
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" }
];

export default function PurchaseOrderPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { hasPermission } = useAppContext();
  const canRead = hasPermission && hasPermission('PURCHASE_ORDER', 'Read');
  const canCreate = hasPermission && hasPermission('PURCHASE_ORDER', 'Create');
  
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("tanggal_po");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getPeriodRange = () => {
    const today = new Date();
    const format = (d) => d.toISOString().slice(0, 10);
    let start = null, end = null;
    switch (periodFilter) {
      case 'today':
        start = format(today);
        end = format(today);
        break;
      case 'week': {
        const day = today.getDay();
        const diffToMonday = (day + 6) % 7; // Monday as start
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = format(monday);
        end = format(sunday);
        break;
      }
      case 'month': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = format(first);
        end = format(last);
        break;
      }
      case 'quarter': {
        const q = Math.floor(today.getMonth() / 3);
        const first = new Date(today.getFullYear(), q * 3, 1);
        const last = new Date(today.getFullYear(), q * 3 + 3, 0);
        start = format(first);
        end = format(last);
        break;
      }
      case 'year': {
        const first = new Date(today.getFullYear(), 0, 1);
        const last = new Date(today.getFullYear(), 12, 0);
        start = format(first);
        end = format(last);
        break;
      }
      default:
        start = null;
        end = null;
    }
    return { start, end };
  };

  // Load purchase orders from API (server-side filter/sort/pagination)
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { start, end } = getPeriodRange();
      const result = await purchaseOrderService.getAll({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_start: start || undefined,
        date_end: end || undefined,
        sort_by: sortBy || undefined,
        order: sortOrder || undefined,
      });

      const rows = Array.isArray(result?.data) ? result.data : [];
      const transformedData = rows.map(po => ({
        id: po.id,
        noPo: po.nomor_po,
        supplier: po.supplier?.nama_supplier || 'N/A',
        tanggalPo: formatDate(po.tanggal_po),
        tanggalPenerimaan: formatDate(po.tanggal_penerimaan),
        tanggalJatuhTempo: formatDate(po.tanggal_jatuh_tempo),
        tanggalPembayaran: formatDate(po.tanggal_pembayaran),
        jumlahItem: po.purchaseOrderItems?.length ?? po.purchase_order_items?.length ?? 0,
        totalAmount: parseFloat(po.total_amount ?? po.totalHarga ?? 0) || 0,
        status: po.status || "Draft",
        catatan: po.catatan || '',
        items: po.purchaseOrderItems ?? po.purchase_order_items ?? []
      }));

      setPurchaseOrders(transformedData);
      setTotalItems(result?.pagination?.total ?? result?.total ?? transformedData.length);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      showAlert("Error", "Gagal memuat data Purchase Order", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, periodFilter, sortBy, sortOrder]);

  // Load purchase orders from API
  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate summary statistics
  const totalPO = totalItems;
  const totalNilai = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const rataRataPerPO = totalPO > 0 ? totalNilai / totalPO : 0;

  // Calculate status breakdown
  const statusBreakdown = {
    Draft: purchaseOrders.filter(po => po.status?.toLowerCase() === "draft").length,
    Received: purchaseOrders.filter(po => po.status?.toLowerCase() === "received").length,
    Paid: purchaseOrders.filter(po => po.status?.toLowerCase() === "paid").length
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-orange-100 text-orange-800";
      case "received": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handle delete PO
  const handleDeletePO = (po) => {
    setSelectedPO(po);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    // Prevent multiple delete operations
    if (isDeleting) {
      console.log('⏭️ Already processing delete operation');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Call delete API - use soft delete
      const response = await purchaseOrderService.delete(selectedPO.id);
      
      console.log('✅ Purchase Order deleted:', response);
      
      // Close modal first
      setShowDeleteModal(false);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Purchase Order berhasil dihapus!", "success", () => {
        loadPurchaseOrders();
      });
      
    } catch (error) {
      console.error('❌ Error deleting Purchase Order:', error);
      showAlert("Error", "Gagal menghapus Purchase Order", "error");
    } finally {
      setIsDeleting(false);
    }
  };



  const handleClearFilter = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPeriodFilter("all");
    setCurrentPage(1);
  };

  const handleExport = async () => {
    try {
      await checkAndRefreshToken();

      const qp = new URLSearchParams();
      if (searchTerm) qp.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') qp.append('status', statusFilter);
      const { start, end } = getPeriodRange();
      if (start) qp.append('date_start', start);
      if (end) qp.append('date_end', end);
      if (sortBy) qp.append('sort_by', sortBy);
      if (sortOrder) qp.append('order', sortOrder);

      // Tidak ada endpoint /report untuk PO → minta list; server bisa balas Excel/JSON berdasarkan Accept
      const url = `${apiConfig.baseUrl}${API_ENDPOINTS.purchaseOrder}${qp.toString() ? `?${qp.toString()}` : ''}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json'
        }
      });

      if (!resp.ok) {
        const ct = resp.headers.get('Content-Type') || resp.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const err = await resp.json().catch(() => null);
          throw new Error(err?.message || `Export gagal (HTTP ${resp.status})`);
        } else {
          const text = await resp.text();
          throw new Error(text || `Export gagal (HTTP ${resp.status})`);
        }
      }

      const ct = resp.headers.get('Content-Type') || resp.headers.get('content-type') || '';
      const isExcel = ct.includes('spreadsheet') || ct.includes('excel') || ct.includes('octet-stream');
      const isJson = ct.includes('application/json');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

      if (isExcel) {
        const blob = await resp.blob();
        const urlObj = URL.createObjectURL(blob);
        const fileName = `purchase-order_${timestamp}.xlsx`;
        const link = document.createElement('a');
        link.href = urlObj;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(urlObj), 1500);
        showAlert('Sukses', 'File Excel berhasil diunduh', 'success');
        return;
      }

      if (isJson) {
        const json = await resp.json();
        if (!window.XLSX) {
          try {
            const mod = await import(/* @vite-ignore */ 'xlsx');
            window.XLSX = mod;
          } catch (e) {
            throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
          }
        }
        const rows = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
        const fmtDate = (s) => (s ? String(s).slice(0, 10) : '');
        const dataRows = rows.map((r) => ({
          'Nomor PO': r?.nomor_po ?? '',
          'Tanggal PO': fmtDate(r?.tanggal_po),
          'Tanggal Penerimaan': fmtDate(r?.tanggal_penerimaan),
          'Tanggal Jatuh Tempo': fmtDate(r?.tanggal_jatuh_tempo),
          'Tanggal Pembayaran': fmtDate(r?.tanggal_pembayaran),
          'Supplier': r?.supplier?.nama_supplier ?? r?.nama_supplier ?? '',
          'Jumlah Item': r?.purchaseOrderItems?.length ?? r?.purchase_order_items?.length ?? 0,
          'Total Amount': r?.total_amount ?? r?.totalHarga ?? '' ,
          'Status': r?.status ?? ''
        }));
        const wb = window.XLSX.utils.book_new();
        const ws = window.XLSX.utils.json_to_sheet(dataRows);
        window.XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const objUrl = URL.createObjectURL(blob);
        const fileName = `purchase-order_${timestamp}.xlsx`;
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objUrl), 1500);
        showAlert('Sukses', 'Laporan XLSX berhasil dibuat dari JSON', 'success');
        return;
      }

      const text = await resp.text();
      throw new Error(text || 'Server tidak mengembalikan file yang dapat diunduh');
    } catch (err) {
      console.error('Error exporting purchase orders:', err);
      showAlert('Error', `Gagal export Purchase Order: ${err.message || err}`, 'error');
    }
  };

  const handleTestConvert = () => {
    // TODO: Implement test convert functionality
    console.log("Testing convert...");
  };

  const handleView = (id) => {
    navigate(`/purchase-order/view/${id}`);
  };

  const handleAddNew = () => {
    navigate('/purchase-order/add');
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (!canRead) {
    return (
      <PageLayout title="Purchase Order (PO)" category="TRANSAKSI">
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center text-gray-600">Anda tidak memiliki akses Read untuk Purchase Order</CardContent>
          </Card>
          <AlertComponent />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Purchase Order (PO)" category="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Purchase Order</h2>
        </div>
        {canCreate ? (
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Purchase Order
        </Button>
        ) : null}
      </div>

        {/* Filter and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari PO:
                </label>
                <Input
                  placeholder="Cari berdasarkan No PO, nama supplier..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status:
                </label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periode:
                </label>
                <Select value={periodFilter} onValueChange={(value) => {
                  setPeriodFilter(value);
                  setCurrentPage(1);
                }}>
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
              {/* Removed refresh button from grid to align with SO layout */}
            </div>
            <div className="flex justify-end flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={loadPurchaseOrders} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleClearFilter}>
                Clear Filter
              </Button>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={handleExport}>
                <FileText className="w-4 h-4 mr-2" />
                Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Order Table */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('nomor_po');
                        setSortOrder(sortBy === 'nomor_po' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      No PO
                    </TableHead>
                    <TableHead className="font-semibold">Supplier</TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('tanggal_po');
                        setSortOrder(sortBy === 'tanggal_po' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Tanggal PO
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('tanggal_penerimaan');
                        setSortOrder(sortBy === 'tanggal_penerimaan' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Tanggal Penerimaan
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('tanggal_jatuh_tempo');
                        setSortOrder(sortBy === 'tanggal_jatuh_tempo' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Tanggal Jatuh Tempo
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('tanggal_pembayaran');
                        setSortOrder(sortBy === 'tanggal_pembayaran' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Tanggal Pembayaran
                    </TableHead>
                    <TableHead className="font-semibold text-center">Jumlah Item</TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('total_amount');
                        setSortOrder(sortBy === 'total_amount' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Total Amount
                    </TableHead>
                    <TableHead
                      className="font-semibold cursor-pointer"
                      onClick={() => {
                        setSortBy('status');
                        setSortOrder(sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                        setCurrentPage(1);
                      }}
                    >
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : purchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        Tidak ada data Purchase Order
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <TableRow key={po.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{po.noPo}</TableCell>
                        <TableCell>{po.supplier}</TableCell>
                        <TableCell>{po.tanggalPo}</TableCell>
                        <TableCell>{po.tanggalPenerimaan}</TableCell>
                        <TableCell>{po.tanggalJatuhTempo}</TableCell>
                        <TableCell>{po.tanggalPembayaran}</TableCell>
                        <TableCell className="text-center">{po.jumlahItem}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(po.totalAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(po.status)}>
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => handleView(po.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {isAdmin() && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeletePO(po)}
                                title="Hapus Purchase Order"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {purchaseOrders.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-white border-t border-gray-200 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Menampilkan {startItem}-{endItem} dari {totalItems} data
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={5}>5 per halaman</option>
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                  </select>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sebelumnya
                    </button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary and Status Breakdown */}
        <Card className="bg-white border-green-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total PO:</span>
                    <span className="font-semibold">{totalPO}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rata-rata per PO:</span>
                    <span className="font-semibold">{formatCurrency(rataRataPerPO)}</span>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Breakdown Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <Badge key={status} className={getStatusColor(status)}>
                      {status}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
                 {/* Delete Confirmation Modal */}
         <CustomAlert
           open={showDeleteModal}
           onOpenChange={setShowDeleteModal}
           title="Konfirmasi Hapus"
            message={`Yakin ingin menghapus Purchase Order "${selectedPO?.noPo}"?`}
           type="warning"
           showCancel={true}
           confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
           cancelText="Tidak"
           onConfirm={handleDeleteConfirm}
         />
         
        
        {/* Alert Modal Component */}
        <AlertComponent />
      </PageLayout>
  );
}
