import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Trash2, RefreshCw, Filter, Edit3, Palette, X, FileText } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import { isAdmin } from '@/lib/utils';
import CustomAlert from '@/components/modals/CustomAlert';
import DeleteRequestModal from '@/components/modals/DeleteRequestModal';
import PageLayout from '@/components/PageLayout';
import { workOrderService } from '@/services/workOrderService';
import apiConfig, { API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/api/GetAuthHeader';
import { checkAndRefreshToken } from '@/lib/tokenUtils';
import { useAppContext } from '@/context/AppContext';

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "On Progress", label: "On Progress" },
  { value: "Selesai", label: "Selesai" }
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
  const { hasPermission } = useAppContext();
  const canRead = hasPermission && hasPermission('WORK_ORDER_PLANNING', 'Read');
  const canCreate = hasPermission && hasPermission('WORK_ORDER_PLANNING', 'Create');
  
  // Create a stable reference for showAlert
  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;
  
  // State
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [woDateStart, setWoDateStart] = useState('');
  const [woDateEnd, setWoDateEnd] = useState('');
  
  // Filter states
  const [filterWoNumber, setFilterWoNumber] = useState('');
  const [filterSoNumber, setFilterSoNumber] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  
  // Debounced filter states (for text inputs)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedFilterWoNumber, setDebouncedFilterWoNumber] = useState('');
  const [debouncedFilterSoNumber, setDebouncedFilterSoNumber] = useState('');
  const [debouncedFilterCustomer, setDebouncedFilterCustomer] = useState('');
  const [debouncedFilterWarehouse, setDebouncedFilterWarehouse] = useState('');
  
  // Sort states
  const [sortBy, setSortBy] = useState('none');
  const [sortOrder, setSortOrder] = useState('asc');
  const handleSort = (field) => {
    setSortBy((prev) => prev === field ? field : field);
    setSortOrder((prev) => (sortBy === field && prev === 'asc') ? 'desc' : 'asc');
    setCurrentPage(1);
  };
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalType, setDeleteModalType] = useState('admin'); // 'admin' or 'request'
  const [selectedWO, setSelectedWO] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // Prevent multiple delete operations
  const [isExporting, setIsExporting] = useState(false); // planning export
  const [isExportingActual, setIsExportingActual] = useState(false);
  
  // Delete request modal state
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);

  // Helper for period → tanggal_wo range
  const pad = (n) => String(n).padStart(2, '0');
  const formatDateLocal = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const getPeriodRange = (period) => {
    const now = new Date();
    let start = null;
    let end = null;
    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week': {
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7;
        start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      }
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter': {
        const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), qStartMonth, 1);
        end = new Date(now.getFullYear(), qStartMonth + 3, 0);
        break;
      }
      case 'year':
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

  // Load work orders from API
  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Convert period filter to date range if needed
      let tanggalWoFrom = woDateStart || undefined;
      let tanggalWoTo = woDateEnd || undefined;
      
      // If period filter is set and no explicit dates, convert period to date range
      if (periodFilter !== 'all' && !woDateStart && !woDateEnd) {
        const range = getPeriodRange(periodFilter);
        if (range) {
          tanggalWoFrom = range.tanggal_wo_start;
          tanggalWoTo = range.tanggal_wo_end;
        }
      }
      
      // Prepare API parameters (using new backend parameter names)
      // Use debounced values for text inputs to avoid hitting API on every keystroke
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        nomor_wo: debouncedFilterWoNumber || undefined,
        nomor_so: debouncedFilterSoNumber || undefined,
        nama_customer: debouncedFilterCustomer || undefined, // Backend accepts nama_customer or pelanggan
        gudang: debouncedFilterWarehouse || undefined,
        tanggal_wo_from: tanggalWoFrom,
        tanggal_wo_to: tanggalWoTo,
        sort_by: sortBy && sortBy !== 'none' ? sortBy : undefined,
        sort_order: sortOrder || undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const result = await workOrderService.getWorkOrders(params);
      
      // Transform API data to match our UI structure
      const transformedData = (result.data || []).map(wo => ({
        id: wo.id,
        woNumber: wo.nomor_wo || 'N/A',
        soNumber: wo.nomor_so || wo.sales_order?.nomor_so || 'N/A',
        customer: wo.nama_pelanggan || wo.sales_order?.pelanggan?.nama_pelanggan || 'N/A',
        warehouse: wo.nama_gudang || wo.sales_order?.gudang?.nama_gudang || 'N/A',
        itemCount: wo.count || wo.workOrderItems?.length || 0,
        status: wo.status || "Pending",
        woDateRaw: wo.tanggal_wo || wo.created_at || null,
        createdAt: formatDate(wo.tanggal_wo || wo.created_at),
        deleteRequestStatus: wo.delete_requested_by ? 'delete_requested' : null,
        deleteRequestedAt: wo.delete_requested_at || null,
        deleteReason: wo.delete_reason || null,
        deleteRequestedBy: wo.delete_requested_by?.name || null,
        items: wo.workOrderItems || []
      }));
      
      setWorkOrders(transformedData);
      setTotalItems(result.total || result.pagination?.total || transformedData.length);
    } catch (error) {
      console.error('Error loading work orders:', error);
      showAlertRef.current("Error", "Gagal memuat data Work Order", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, periodFilter, woDateStart, woDateEnd, debouncedFilterWoNumber, debouncedFilterSoNumber, debouncedFilterCustomer, debouncedFilterWarehouse, sortBy, sortOrder]);

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
    // Clear canvas-previews folder when Work Order page loads (only once)
    const clearCanvasPreviews = async () => {
      try {
        if (window.electronAPI && window.electronAPI.clearCanvasPreviews) {
          console.log('🧹 Clearing canvas-previews folder...');
          const result = await window.electronAPI.clearCanvasPreviews();
          if (result.success) {
            console.log('✅ Canvas-previews folder cleared successfully');
          } else {
            console.warn('⚠️ Failed to clear canvas-previews folder:', result.error);
          }
        } else {
          console.log('📁 Electron API not available for clearing canvas-previews');
        }
      } catch (error) {
        console.error('❌ Error clearing canvas-previews folder:', error);
      }
    };

    clearCanvasPreviews();
  }, []); // Empty dependency array - only run once on mount

  // Debounce text input filters (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterWoNumber(filterWoNumber);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterWoNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterSoNumber(filterSoNumber);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterSoNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterCustomer(filterCustomer);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterCustomer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterWarehouse(filterWarehouse);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterWarehouse]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleAddWorkOrder = () => {
    navigate('/work-order/add');
  };

  const handleViewDetail = (id) => {
    navigate(`/work-order/view/${id}`);
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
      showAlertRef.current("Sukses", "Work Order berhasil dihapus!", "success", () => {
        loadWorkOrders();
      });
      
    } catch (error) {
      console.error('❌ Error deleting Work Order:', error);
      showAlertRef.current("Error", "Gagal menghapus Work Order", "error");
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
      showAlertRef.current(
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
      showAlertRef.current("Error", "Gagal mengajukan permintaan hapus", "error");
    }
  };

  // Handle cancel delete request (non-admin)
  const handleCancelDeleteRequest = async (wo) => {
    try {
      // Call cancel delete request API
      const response = await workOrderService.cancelDeleteRequest(wo.id);
      
      console.log('✅ Delete request cancelled:', response);
      
      // Show success message and reload data after alert closes
      showAlertRef.current("Sukses", "Permintaan hapus berhasil dibatalkan!", "success", () => {
        loadWorkOrders();
      });
      
    } catch (error) {
      console.error('❌ Error cancelling delete request:', error);
      showAlertRef.current("Error", "Gagal membatalkan permintaan hapus", "error");
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

  // Build workbook for planning report JSON
  const buildWorkbookFromPlanning = (json) => {
    const rows = Array.isArray(json?.data) ? json.data : [];
    const formatDate = (s) => (s ? String(s).slice(0, 10) : '');
    const dataRows = rows.map((r) => ({
      'Nomor WO': r?.nomor_wo ?? '',
      'Tanggal WO': formatDate(r?.tanggal_wo),
      'Status': r?.status ?? '',
      'Prioritas': r?.prioritas ?? '',
      'Nomor SO': r?.nomor_so ?? '',
      'Pelanggan': r?.nama_pelanggan ?? '',
      'Gudang': r?.nama_gudang ?? '',
      'Handover Method': r?.handover_method ?? ''
    }));

    const wb = window.XLSX.utils.book_new();
    const wsData = window.XLSX.utils.json_to_sheet(dataRows);
    window.XLSX.utils.book_append_sheet(wb, wsData, 'Data');
    return wb;
  };

  // Build workbook for actual report JSON (reuse mapping)
  const buildWorkbookFromActual = (json) => {
    const rows = Array.isArray(json?.data) ? json.data : [];
    const formatDate = (s) => (s ? String(s).slice(0, 10) : '');
    const dataRows = rows.map((r) => ({
      'Nomor WO': r?.nomor_wo ?? '',
      'Tanggal WO': formatDate(r?.tanggal_wo),
      'Tanggal Actual': formatDate(r?.tanggal_actual),
      'Status Actual': r?.status ?? '',
      'Prioritas': r?.prioritas ?? '',
      'Nomor SO': r?.nomor_so ?? '',
      'Pelanggan': r?.nama_pelanggan ?? '',
      'Gudang': r?.nama_gudang ?? ''
    }));

    const wb = window.XLSX.utils.book_new();
    const wsData = window.XLSX.utils.json_to_sheet(dataRows);
    window.XLSX.utils.book_append_sheet(wb, wsData, 'Data');
    return wb;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await checkAndRefreshToken();
      // Export langsung dari endpoint list dengan filter yang sama (tanpa pagination)
      // Use current filter values (not debounced) for export
      const listParams = new URLSearchParams();
      if (searchTerm) listParams.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') listParams.append('status', statusFilter);
      if (filterWoNumber) listParams.append('nomor_wo', filterWoNumber);
      if (filterSoNumber) listParams.append('nomor_so', filterSoNumber);
      if (filterCustomer) listParams.append('nama_customer', filterCustomer);
      if (filterWarehouse) listParams.append('gudang', filterWarehouse);
      if (sortBy && sortBy !== 'none') listParams.append('sort_by', sortBy);
      if (sortOrder) listParams.append('sort_order', sortOrder);
      // Tanggal mengikuti filter tabel (planning memakai tanggal_wo_from/tanggal_wo_to)
      if (woDateStart) listParams.append('tanggal_wo_from', woDateStart);
      if (woDateEnd) listParams.append('tanggal_wo_to', woDateEnd);
      if (!woDateStart && !woDateEnd && periodFilter && periodFilter !== 'all') {
        const range = getPeriodRange(periodFilter);
        if (range) {
          listParams.append('tanggal_wo_from', range.tanggal_wo_start);
          listParams.append('tanggal_wo_to', range.tanggal_wo_end);
        }
      }
      // Ambil semua data sesuai filter
      listParams.append('per_page', '10000');

      const listUrl = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderPlanning}${listParams.toString() ? `?${listParams.toString()}` : ''}`;
      const listResp = await fetch(listUrl, {
        method: 'GET',
        headers: { ...getAuthHeader(), Accept: 'application/json' }
      });
      if (!listResp.ok) {
        const txt = await listResp.text();
        throw new Error(txt || `Export via list gagal (HTTP ${listResp.status})`);
      }
      const json = await listResp.json();
      if (!window.XLSX) {
        try {
          const mod = await import(/* @vite-ignore */ 'xlsx');
          window.XLSX = mod;
        } catch (e) {
          throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
        }
      }
      const wb = buildWorkbookFromPlanning(json);
      const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const objectUrl = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      const fileName = `wo-planning-report_${timestamp}.xlsx`;
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      showAlertRef.current('Unduhan dimulai', 'Laporan XLSX sedang diunduh', 'info');
    } catch (error) {
      console.error('Error exporting WO Planning:', error);
      showAlertRef.current('Error', `Gagal export WO Planning: ${error.message || error}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Export WO Actual directly from this page (same filters)
  const handleExportActual = async () => {
    try {
      setIsExportingActual(true);
      await checkAndRefreshToken();

      // Export WO Actual via endpoint list (filter sama, tanpa pagination)
      const listParams = new URLSearchParams();
      if (searchTerm) listParams.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') listParams.append('status', statusFilter);
      if (filterWoNumber) listParams.append('nomor_wo', filterWoNumber);
      if (filterSoNumber) listParams.append('nomor_so', filterSoNumber);
      // WO Actual list memakai date_start/date_end
      if (woDateStart) listParams.append('date_start', woDateStart);
      if (woDateEnd) listParams.append('date_end', woDateEnd);
      if (!woDateStart && !woDateEnd && periodFilter && periodFilter !== 'all') {
        const range = getPeriodRange(periodFilter);
        if (range) {
          listParams.append('date_start', range.tanggal_wo_start);
          listParams.append('date_end', range.tanggal_wo_end);
        }
      }
      // Ambil semua data sesuai filter
      listParams.append('per_page', '10000');

      const listUrl = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderActual}${listParams.toString() ? `?${listParams.toString()}` : ''}`;
      const listResp = await fetch(listUrl, {
        method: 'GET',
        headers: { ...getAuthHeader(), Accept: 'application/json' }
      });
      if (!listResp.ok) {
        const txt = await listResp.text();
        throw new Error(txt || `Export via list gagal (HTTP ${listResp.status})`);
      }
      const json = await listResp.json();
      if (!window.XLSX) {
        try {
          const mod = await import(/* @vite-ignore */ 'xlsx');
          window.XLSX = mod;
        } catch (e) {
          throw new Error("Dependency 'xlsx' belum terpasang. Jalankan: npm install xlsx");
        }
      }
      const wb = buildWorkbookFromActual(json);
      const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const objectUrl = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      const fileName = `wo-actual-report_${timestamp}.xlsx`;
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      showAlertRef.current('Unduhan dimulai', 'Laporan XLSX sedang diunduh', 'info');
    } catch (error) {
      console.error('Error exporting WO Actual:', error);
      showAlertRef.current('Error', `Gagal export WO Actual: ${error.message || error}`, 'error');
    } finally {
      setIsExportingActual(false);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Selesai':
      case 'Completed': // Handle both for backward compatibility
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canRead) {
    return (
      <PageLayout title="Work Order (Planning)" category="TRANSAKSI">
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center text-gray-600">Anda tidak memiliki akses Read untuk Work Order Planning</CardContent>
          </Card>
          <AlertComponent />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Work Order (Planning)" category="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Work Order</h2>
        </div>
        <div className="flex gap-2">
          {/* Hidden buttons as requested
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
          */}
          {canCreate ? (
          <Button onClick={handleAddWorkOrder} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Work Order
          </Button>
          ) : null}
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
           
           {/* Search and Date Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                 Search Global
               </label>
               <Input
                 placeholder="Cari semua data..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal WO Dari
              </label>
              <Input
                type="date"
                placeholder="dd/mm/yyyy"
                value={woDateStart}
                onChange={(e) => setWoDateStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal WO Sampai
              </label>
              <Input
                type="date"
                placeholder="dd/mm/yyyy"
                value={woDateEnd}
                onChange={(e) => setWoDateEnd(e.target.value)}
              />
            </div>
           </div>
           
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setSearchTerm('');
            setFilterWoNumber('');
            setFilterSoNumber('');
            setFilterCustomer('');
            setFilterWarehouse('');
            setStatusFilter('all');
            setPeriodFilter('all');
            setWoDateStart('');
            setWoDateEnd('');
            setSortBy('none');
            setSortOrder('asc');
          }}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filter
        </Button>
        <Button 
          variant="outline" 
          onClick={loadWorkOrders} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button 
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          onClick={handleExport}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4" />
          {isExporting ? 'Report Planning...' : 'Report Planning'}
        </Button>
        {/* Report Actual dipindahkan ke halaman WO Actual */}
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
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('nomor_wo')}>No. WO</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('nomor_so')}>No. SO</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('pelanggan')}>Pelanggan</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('gudang')}>Asal Gudang</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('tanggal_wo')}>Tanggal WO</TableHead>
                  <TableHead className="font-semibold text-center cursor-pointer select-none" onClick={() => handleSort('jumlah_item')}>Jumlah Item</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('status')}>Status</TableHead>
                  <TableHead className="font-semibold text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : workOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                      <TableCell>{wo.createdAt}</TableCell>
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
                            onClick={() => handleViewDetail(wo.id)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
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
