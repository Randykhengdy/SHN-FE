import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Trash2, RefreshCw, Download, Filter, Edit3, Palette } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import { isAdmin } from '@/lib/utils';
import CustomAlert from '@/components/modals/CustomAlert';
import DeleteRequestModal from '@/components/modals/DeleteRequestModal';
import PageLayout from '@/components/PageLayout';

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "Pending", label: "Pending" },
  { value: "On Progress", label: "On Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" }
];

const periodOptions = [
  { value: "all", label: "Semua Periode" },
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "Minggu Ini" },
  { value: "month", label: "Bulan Ini" },
  { value: "quarter", label: "Kuartal Ini" },
  { value: "year", label: "Tahun Ini" }
];

export default function WorkOrderPage() {
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  // State
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Filter states
  const [filterWoNumber, setFilterWoNumber] = useState('');
  const [filterSoNumber, setFilterSoNumber] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState('admin'); // 'admin' or 'request'
  const [selectedWO, setSelectedWO] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // Prevent multiple delete operations
  
  // Delete request modal state
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);

  // Load work orders from API
  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const result = await workOrderService.getWorkOrders();
      
      // Transform API data to match our UI structure
      const transformedData = result.data.map(wo => ({
        id: wo.id,
        woNumber: wo.nomor_wo || 'N/A',
        soNumber: wo.sales_order?.nomor_so || 'N/A',
        customer: wo.sales_order?.pelanggan?.nama_pelanggan || 'N/A',
        warehouse: wo.sales_order?.gudang?.nama_gudang || 'N/A',
        itemCount: wo.workOrderItems?.length || 0,
        status: wo.status || "Pending",
        createdAt: formatDate(wo.created_at),
        deleteRequestStatus: wo.delete_requested_by ? 'delete_requested' : null,
        deleteRequestedAt: wo.delete_requested_at || null,
        deleteReason: wo.delete_reason || null,
        deleteRequestedBy: wo.delete_requested_by?.name || null,
        items: wo.workOrderItems || []
      }));
      
      // Apply filters
      let filteredData = transformedData;
      
      if (filterWoNumber) {
        filteredData = filteredData.filter(wo => 
          wo.woNumber.toLowerCase().includes(filterWoNumber.toLowerCase())
        );
      }
      
      if (filterSoNumber) {
        filteredData = filteredData.filter(wo => 
          wo.soNumber.toLowerCase().includes(filterSoNumber.toLowerCase())
        );
      }
      
      if (filterCustomer) {
        filteredData = filteredData.filter(wo => 
          wo.customer.toLowerCase().includes(filterCustomer.toLowerCase())
        );
      }
      
      if (filterWarehouse) {
        filteredData = filteredData.filter(wo => 
          wo.warehouse.toLowerCase().includes(filterWarehouse.toLowerCase())
        );
      }
      
      if (statusFilter !== "all") {
        filteredData = filteredData.filter(wo => wo.status.toLowerCase() === statusFilter.toLowerCase());
      }
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setWorkOrders(paginatedData);
      setTotalItems(filteredData.length);
    } catch (error) {
      console.error('Error loading work orders:', error);
      showAlert("Error", "Gagal memuat data Work Order", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, filterWoNumber, filterSoNumber, filterCustomer, filterWarehouse, statusFilter, periodFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleAddWorkOrder = () => {
    navigate('/work-order/add');
  };

  const handleViewDetail = (woNumber) => {
    navigate(`/work-order/view/${woNumber}`);
  };

  // Handle delete WO (admin only)
  const handleDeleteWO = (wo) => {
    setSelectedWO(wo);
    setDeleteModalType('admin');
    setShowDeleteModal(true);
  };

  // Handle request delete WO (non-admin)
  const handleRequestDeleteWO = (wo) => {
    setSelectedWO(wo);
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
      const response = await workOrderService.softDeleteWorkOrder(selectedWO.id);
      
      console.log('✅ Work Order deleted:', response);
      
      // Close modal first
      setShowDeleteModal(false);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Work Order berhasil dihapus!", "success", () => {
        loadWorkOrders();
      });
      
    } catch (error) {
      console.error('❌ Error deleting Work Order:', error);
      showAlert("Error", "Gagal menghapus Work Order", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle request delete confirmation (non-admin)
  const handleRequestDeleteConfirm = async (reason) => {
    try {
      // Call request delete API
      const response = await workOrderService.requestDeleteWorkOrder(selectedWO.id, reason);
      
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
          loadWorkOrders();
        }
      );
      
    } catch (error) {
      console.error('❌ Error requesting delete:', error);
      showAlert("Error", "Gagal mengajukan permintaan hapus", "error");
    }
  };

  // Handle cancel delete request (non-admin)
  const handleCancelDeleteRequest = async (wo) => {
    try {
      // Call cancel delete request API
      const response = await workOrderService.cancelDeleteRequest(wo.id);
      
      console.log('✅ Delete request cancelled:', response);
      
      // Show success message and reload data after alert closes
      showAlert("Sukses", "Permintaan hapus berhasil dibatalkan!", "success", () => {
        loadWorkOrders();
      });
      
    } catch (error) {
      console.error('❌ Error cancelling delete request:', error);
      showAlert("Error", "Gagal membatalkan permintaan hapus", "error");
    }
  };

  const handleClearFilter = () => {
    setFilterWoNumber('');
    setFilterSoNumber('');
    setFilterCustomer('');
    setFilterWarehouse('');
    setStatusFilter('all');
    setPeriodFilter('all');
    setSearchTerm('');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    showAlert('Info', 'Fitur export akan segera tersedia', 'info');
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageLayout title="Work Order (Planning)" category="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Work Order</h2>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/canvas-testing')} 
            variant="outline" 
            className="w-full sm:w-auto"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Test Canvas
          </Button>
          <Button 
            onClick={() => navigate('/canvas-grid-testing')} 
            variant="outline" 
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 hover:from-orange-600 hover:to-red-600"
          >
            <Palette className="w-4 h-4 mr-2" />
            Canvas Grid
          </Button>
          <Button onClick={handleAddWorkOrder} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Work Order
          </Button>
        </div>
      </div>

             {/* Filter Section */}
       <Card className="mb-6">
         <CardContent className="p-4">
           <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Filter no WO
               </label>
               <Input
                 placeholder="Cari no WO..."
                 value={filterWoNumber}
                 onChange={(e) => setFilterWoNumber(e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Filter no SO
               </label>
               <Input
                 placeholder="Cari no SO..."
                 value={filterSoNumber}
                 onChange={(e) => setFilterSoNumber(e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Pelanggan
               </label>
               <Input
                 placeholder="Cari pelanggan..."
                 value={filterCustomer}
                 onChange={(e) => setFilterCustomer(e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Asal Gudang
               </label>
               <Input
                 placeholder="Cari gudang..."
                 value={filterWarehouse}
                 onChange={(e) => setFilterWarehouse(e.target.value)}
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Status
               </label>
               <Select value={statusFilter} onValueChange={setStatusFilter}>
                 <SelectTrigger>
                   <SelectValue placeholder="Semua Status" />
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
           
           <div className="flex justify-end">
             <Button 
               variant="outline" 
               onClick={loadWorkOrders} 
               disabled={loading}
               className="flex items-center gap-2"
             >
               <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
               Refresh
             </Button>
           </div>
         </CardContent>
       </Card>

      {/* Work Order Table */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">No. WO</TableHead>
                  <TableHead className="font-semibold">No. SO</TableHead>
                  <TableHead className="font-semibold">Pelanggan</TableHead>
                  <TableHead className="font-semibold">Asal Gudang</TableHead>
                  <TableHead className="font-semibold text-center">Jumlah Item</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada data Work Order
                    </TableCell>
                  </TableRow>
                ) : (
                  workOrders.map((wo) => (
                    <TableRow key={wo.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{wo.woNumber}</TableCell>
                      <TableCell>{wo.soNumber}</TableCell>
                      <TableCell>{wo.customer}</TableCell>
                      <TableCell>{wo.warehouse}</TableCell>
                      <TableCell className="text-center">{wo.itemCount}</TableCell>
                      <TableCell>
                        {wo.deleteRequestStatus === 'delete_requested' ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            🗑️ Delete Requested
                          </Badge>
                        ) : (
                          <Badge className={getStatusColor(wo.status)}>
                            {wo.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(wo.woNumber)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {isAdmin() ? (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleDeleteWO(wo)}
                              title="Hapus Work Order (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : wo.deleteRequestStatus === 'delete_requested' ? (
                            <Button 
                              size="sm" 
                              className="bg-yellow-600 hover:bg-yellow-700" 
                              onClick={() => handleCancelDeleteRequest(wo)}
                              title="Batalkan Permintaan Hapus"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-700" 
                              onClick={() => handleRequestDeleteWO(wo)}
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
          {workOrders.length > 0 && (
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

      {/* Delete Confirmation Modal */}
      <CustomAlert
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Konfirmasi Hapus"
        message={`Yakin ingin menghapus Work Order "${selectedWO?.woNumber}"?`}
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
        workOrder={selectedWO}
        onConfirm={handleRequestDeleteConfirm}
        onCancel={() => setShowDeleteRequestModal(false)}
      />
     
      {/* Alert Modal Component */}
      <AlertComponent />
    </PageLayout>
  );
}
