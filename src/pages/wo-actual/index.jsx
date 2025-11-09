import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, RefreshCw, Filter, X, Plus } from 'lucide-react';
import { useAlert } from '@/hooks/useAlert';
import PageLayout from '@/components/PageLayout';
import { woActualService } from '@/services/woActualService';
import apiConfig, { API_ENDPOINTS } from '@/config/api';
import { getAuthHeader } from '@/api/GetAuthHeader';
import { checkAndRefreshToken } from '@/lib/tokenUtils';

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

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

export default function WOActualPage() {
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
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter states
  const [filterWoNumber, setFilterWoNumber] = useState('');
  const [filterSoNumber, setFilterSoNumber] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // Load WO Actual from API
  const loadWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const range = periodFilter !== 'all' ? getPeriodRange(periodFilter) : null;
      const result = await woActualService.getWOActuals({
        page: currentPage,
        per_page: itemsPerPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        nomor_wo: filterWoNumber,
        nomor_so: filterSoNumber,
        date_from: range?.date_from,
        date_to: range?.date_to
      });
      
      // Transform API data to match our UI structure
      const transformedData = (result.data || []).map(woActual => ({
        id: woActual.id,
        woNumber: woActual.nomor_wo || 'N/A',
        soNumber: woActual.nomor_so || 'N/A',
        customer: woActual.nama_pelanggan || 'N/A',
        warehouse: woActual.nama_gudang || 'N/A',
        itemCount: woActual.jumlah_item ?? 0,
        status: woActual.status || "Pending",
        createdAt: formatDate(woActual.tanggal_actual || woActual.created_at),
        planningId: woActual.work_order_planning_id
      }));
      
      // Since filtering is now handled by API, we can directly use the data
      setWorkOrders(transformedData);
      setTotalItems(result.total || transformedData.length);
      
    } catch (error) {
      console.error('❌ Error loading Work Orders:', error);
      showAlert("Error", "Gagal memuat data Work Order Actual", "error");
    } finally {
      setLoading(false);
    }
  }, [filterWoNumber, filterSoNumber, filterCustomer, filterWarehouse, statusFilter, searchTerm, currentPage, itemsPerPage, periodFilter]);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  // Handle navigation to add page
  const handleAddWOActual = () => {
    navigate('/wo-actual/add');
  };

  // Handle view detail
  const handleViewDetail = (woId) => {
    navigate(`/wo-actual/view/${woId}`);
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

  // Helper for period → date range (actual date)
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
      date_from: formatDateLocal(start),
      date_to: formatDateLocal(end),
    };
  };

  // Build workbook for actual report JSON
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

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (filterWoNumber) queryParams.append('nomor_wo', filterWoNumber);
      if (filterSoNumber) queryParams.append('nomor_so', filterSoNumber);
      if (periodFilter && periodFilter !== 'all') {
        const range = getPeriodRange(periodFilter);
        if (range) {
          queryParams.append('date_from', range.date_from);
          queryParams.append('date_to', range.date_to);
        }
      }
      queryParams.append('per_page', '10000');

      const url = `${apiConfig.baseUrl}${API_ENDPOINTS.workOrderActual}/report${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json'
        }
      });

      if (!response.ok) {
        const ct = response.headers.get('Content-Type') || response.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.message || `Export failed (HTTP ${response.status})`);
        } else {
          const text = await response.text();
          throw new Error(text || `Export failed (HTTP ${response.status})`);
        }
      }

      const contentType = response.headers.get('Content-Type') || response.headers.get('content-type') || '';
      const isExcel = contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('octet-stream');
      const isJson = contentType.includes('application/json');
      const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');

      if (isExcel) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `wo-actual-report_${timestamp}.xlsx`;
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        showAlert('Unduhan dimulai', 'File Excel sedang diunduh', 'info');
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
        const wb = buildWorkbookFromActual(json);
        const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const objectUrl = URL.createObjectURL(blob);
        const fileName = `wo-actual-report_${timestamp}.xlsx`;
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
        showAlert('Unduhan dimulai', 'Laporan XLSX sedang diunduh', 'info');
      } else {
        const text = await response.text();
        throw new Error(text || 'Server tidak mengembalikan file yang dapat diunduh');
      }
    } catch (error) {
      console.error('Error exporting WO Actual:', error);
      showAlert('Error', `Gagal export WO Actual: ${error.message || error}`, 'error');
    } finally {
      setIsExporting(false);
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
    <PageLayout title="Work Order Actual" category="TRANSAKSI">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Work Order Actual</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddWOActual} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah WO Actual
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
                Filter Pelanggan
              </label>
              <Input
                placeholder="Cari pelanggan..."
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter Gudang
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
                  <SelectValue placeholder="Pilih status" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periode
              </label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pencarian Global
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari semua kolom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleClearFilter}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filter
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
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
                      Tidak ada data Work Order Actual
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
                        <Badge className={getStatusColor(wo.status)}>
                          {wo.status}
                        </Badge>
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
     
      {/* Alert Modal Component */}
      <AlertComponent />
    </PageLayout>
  );
}