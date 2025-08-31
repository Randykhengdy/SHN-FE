import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter, Download, FileText, Eye, Trash2, ArrowRight, Calendar, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { salesOrderService } from "@/services/salesOrderService";
import { useAlert } from "@/hooks/useAlert";
import { isAdmin } from "@/lib/utils";
import CustomAlert from "@/components/modals/CustomAlert";
import DeleteRequestModal from "@/components/modals/DeleteRequestModal";
import SalesOrderLayout from "@/components/SalesOrderLayout";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in-progress", label: "In Progress" },
  { value: "partial-wo", label: "Partial WO" },
  { value: "completed", label: "Completed" }
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" }
];

export default function SalesOrderListPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState('admin'); // 'admin' or 'request'
  const [selectedSO, setSelectedSO] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // Prevent multiple delete operations
  
  // Delete request modal state
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);

  // Load sales orders from API
  const loadSalesOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await salesOrderService.getAll();
      
      // Transform API data to match our UI structure
      const transformedData = result.data.map(so => ({
        id: so.id,
        noSo: so.nomor_so,
        pelanggan: so.pelanggan?.nama_pelanggan || 'N/A',
        tanggalSo: formatDate(so.tanggal_so),
        tanggalPengiriman: formatDate(so.tanggal_pengiriman),
        asalGudang: so.gudang?.nama_gudang || 'N/A',
        jumlahItem: so.salesOrderItems?.length || 0,
        totalHarga: parseFloat(so.total_harga_so) || 0,
        subtotal: parseFloat(so.subtotal) || 0,
        totalDiskon: parseFloat(so.total_diskon) || 0,
        ppnAmount: parseFloat(so.ppn_amount) || 0,
        syaratPembayaran: so.syarat_pembayaran,
         status: so.status || "Draft",
         deleteRequestStatus: so.delete_requested_by ? 'delete_requested' : null,
         deleteRequestedAt: so.delete_requested_at || null,
         deleteReason: so.delete_reason || null,
         deleteRequestedBy: so.delete_requested_by?.name || null,
        items: so.salesOrderItems || []
      }));
      
      // Apply filters
      let filteredData = transformedData;
      
      if (searchTerm) {
        filteredData = filteredData.filter(so => 
          so.noSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          so.pelanggan.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (statusFilter !== "all") {
        filteredData = filteredData.filter(so => so.status.toLowerCase() === statusFilter);
      }
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setSalesOrders(paginatedData);
      setTotalItems(filteredData.length);
    } catch (error) {
      console.error('Error loading sales orders:', error);
      showAlert("Error", "Gagal memuat data Sales Order", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, periodFilter]);

  // Load sales orders from API
  useEffect(() => {
    loadSalesOrders();
  }, [loadSalesOrders]);

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
  const totalSO = totalItems;
  const totalNilai = salesOrders.reduce((sum, so) => sum + so.totalHarga, 0);
  const rataRataPerSO = totalSO > 0 ? totalNilai / totalSO : 0;

  // Calculate status breakdown
  const statusBreakdown = {
    Draft: salesOrders.filter(so => so.status === "Draft").length,
    Confirmed: salesOrders.filter(so => so.status === "Confirmed").length,
    "In Progress": salesOrders.filter(so => so.status === "In Progress").length,
    "Partial WO": salesOrders.filter(so => so.status === "Partial WO").length,
    Completed: salesOrders.filter(so => so.status === "Completed").length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft": return "bg-orange-100 text-orange-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-yellow-100 text-yellow-800";
      case "Partial WO": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
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

  // Handle delete SO (admin only)
  const handleDeleteSO = (so) => {
    setSelectedSO(so);
    setDeleteModalType('admin');
    setShowDeleteModal(true);
  };

  // Handle request delete SO (non-admin)
  const handleRequestDeleteSO = (so) => {
    setSelectedSO(so);
    setShowDeleteRequestModal(true);
  };

  // Handle delete confirmation (admin)
  const handleDeleteConfirm = async () => {
    // Prevent multiple delete operations
    if (isDeleting) {
      console.log('⏭️ Already processing delete operation');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Call delete API - use soft delete
      const response = await salesOrderService.delete(selectedSO.id, 'soft');
      
      console.log('✅ Sales Order deleted:', response);
      
      // Close modal first
      setShowDeleteModal(false);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Sales Order berhasil dihapus!", "success", () => {
        loadSalesOrders();
      });
      
    } catch (error) {
      console.error('❌ Error deleting Sales Order:', error);
      showAlert("Error", "Gagal menghapus Sales Order", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle request delete confirmation (non-admin)
  const handleRequestDeleteConfirm = async (reason) => {
    try {
      // Call request delete API
      const response = await salesOrderService.requestDelete(selectedSO.id, reason);
      
      console.log('✅ Delete request submitted:', response);
      
      // Close modal first
      setShowDeleteRequestModal(false);
      
      // Show success message and reload data after alert closes
      showAlert(
        "Sukses", 
        "Permintaan hapus berhasil diajukan!\n\n" +
        "📧 Admin akan meninjau permintaan Anda.\n" +
        "📋 Alasan: " + reason, 
        "success",
        () => {
          loadSalesOrders();
        }
      );
      
    } catch (error) {
      console.error('❌ Error requesting delete:', error);
      showAlert("Error", "Gagal mengajukan permintaan hapus", "error");
    }
  };

  // Handle cancel delete request (non-admin)
  const handleCancelDeleteRequest = async (so) => {
    try {
      // Call cancel delete request API
      const response = await salesOrderService.cancelDeleteRequest(so.id);
      
      console.log('✅ Delete request cancelled:', response);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Permintaan hapus berhasil dibatalkan!", "success", () => {
        loadSalesOrders();
      });
      
    } catch (error) {
      console.error('❌ Error cancelling delete request:', error);
      showAlert("Error", "Gagal membatalkan permintaan hapus", "error");
    }
  };



  const handleClearFilter = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPeriodFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting sales orders...");
  };

  const handleTestConvert = () => {
    // TODO: Implement test convert functionality
    console.log("Testing convert...");
  };

  const handleView = (id) => {
    navigate(`/sales-order/view/${id}`);
  };

  const handleAddNew = () => {
    navigate('/sales-order/add');
  };

  const handleConvertToWO = (id) => {
    // TODO: Implement convert to WO functionality
    console.log("Converting to WO:", id);
  };

  const handleDelete = (id) => {
    // TODO: Implement delete functionality
    console.log("Deleting sales order:", id);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <SalesOrderLayout title="Sales Order (SO)" subtitle="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Sales Order</h2>
        </div>
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Sales Order
        </Button>
      </div>

        {/* Filter and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari SO:
                </label>
                <Input
                  placeholder="Cari berdasarkan No SO, nama pelanggan..."
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
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={loadSalesOrders} 
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleClearFilter}>
                Clear Filter
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={handleTestConvert}>
                <FileText className="w-4 h-4 mr-2" />
                Test Convert
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales Order Table */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">No SO</TableHead>
                    <TableHead className="font-semibold">Pelanggan</TableHead>
                    <TableHead className="font-semibold">Tanggal SO</TableHead>
                    <TableHead className="font-semibold">Tanggal Pengiriman</TableHead>
                    <TableHead className="font-semibold">Asal Gudang</TableHead>
                    <TableHead className="font-semibold text-center">Jumlah Item</TableHead>
                    <TableHead className="font-semibold">Subtotal</TableHead>
                    <TableHead className="font-semibold">Diskon</TableHead>
                    <TableHead className="font-semibold">PPN</TableHead>
                    <TableHead className="font-semibold">Total Harga</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading data...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : salesOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                        Tidak ada data Sales Order
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesOrders.map((so) => (
                      <TableRow key={so.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{so.noSo}</TableCell>
                        <TableCell>{so.pelanggan}</TableCell>
                        <TableCell>{so.tanggalSo}</TableCell>
                        <TableCell>{so.tanggalPengiriman}</TableCell>
                        <TableCell>{so.asalGudang}</TableCell>
                        <TableCell className="text-center">{so.jumlahItem}</TableCell>
                        <TableCell>{formatCurrency(so.subtotal)}</TableCell>
                        <TableCell>{formatCurrency(so.totalDiskon)}</TableCell>
                        <TableCell>{formatCurrency(so.ppnAmount)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(so.totalHarga)}</TableCell>
                                                 <TableCell>
                           {so.deleteRequestStatus === 'delete_requested' ? (
                             <Badge className="bg-orange-100 text-orange-800">
                               🗑️ Delete Requested
                             </Badge>
                           ) : (
                             <Badge className={getStatusColor(so.status)}>
                               {so.status}
                             </Badge>
                           )}
                         </TableCell>
                        <TableCell>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <Button size="sm" variant="outline" onClick={() => handleView(so.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConvertToWO(so.id)}>
                              <ArrowRight className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Convert to WO</span>
                            </Button>
                            {isAdmin() ? (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteSO(so)}
                                title="Hapus Sales Order (Admin)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : so.deleteRequestStatus === 'delete_requested' ? (
                              <Button 
                                size="sm" 
                                className="bg-yellow-600 hover:bg-yellow-700" 
                                onClick={() => handleCancelDeleteRequest(so)}
                                title="Batalkan Permintaan Hapus"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="bg-orange-600 hover:bg-orange-700" 
                                onClick={() => handleRequestDeleteSO(so)}
                                title="Ajukan Permintaan Hapus"
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
            {salesOrders.length > 0 && (
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
                    <span className="text-gray-600">Total SO:</span>
                    <span className="font-semibold">{totalSO}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Nilai:</span>
                    <span className="font-semibold">{formatCurrency(totalNilai)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rata-rata per SO:</span>
                    <span className="font-semibold">{formatCurrency(rataRataPerSO)}</span>
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
           message={`Yakin ingin menghapus Sales Order "${selectedSO?.noSo}"?`}
           type="warning"
           showCancel={true}
           confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
           cancelText="Tidak"
           onConfirm={handleDeleteConfirm}
         />
         
         {/* Delete Request Modal */}
         <DeleteRequestModal
           open={showDeleteRequestModal}
           onOpenChange={setShowDeleteRequestModal}
           salesOrder={selectedSO}
           onConfirm={handleRequestDeleteConfirm}
           onCancel={() => setShowDeleteRequestModal(false)}
         />
        
        {/* Alert Modal Component */}
        <AlertComponent />
      </SalesOrderLayout>
  );
}
