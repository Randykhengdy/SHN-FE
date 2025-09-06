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
import CustomAlert from '@/components/modals/CustomAlert';
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
  const { showAlert } = useAlert();
  
  // State
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Filter states
  const [filterWoNumber, setFilterWoNumber] = useState('');
  const [filterSoNumber, setFilterSoNumber] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // Mock data for now
  const mockWorkOrders = [
    {
      id: 1,
      woNumber: 'WO-20250812-745',
      soNumber: 'SO-20250812-745',
      customer: 'CV Sukses Mandiri',
      warehouse: 'Gudang Cabang 1 - Jakarta Selatan',
      itemCount: 7,
      status: 'On Progress',
      createdAt: '2025-08-12'
    },
    {
      id: 2,
      woNumber: 'WO-20250812-746',
      soNumber: 'SO-20250812-746',
      customer: 'PT Maju Bersama',
      warehouse: 'Gudang Pusat - Jakarta Utara',
      itemCount: 12,
      status: 'Pending',
      createdAt: '2025-08-12'
    }
  ];

  const loadWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await workOrderService.getWorkOrders({
      //   page: currentPage,
      //   limit: itemsPerPage,
      //   search: searchTerm,
      //   status: statusFilter,
      //   period: periodFilter
      // });
      
      // For now, use mock data
      setTimeout(() => {
        setWorkOrders(mockWorkOrders);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error loading work orders:', error);
      showAlert('Error', 'Gagal memuat data Work Order', 'error');
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, periodFilter, showAlert]);

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleAddWorkOrder = () => {
    navigate('/work-order/add');
  };

  const handleViewDetail = (woNumber) => {
    navigate(`/work-order/view/${woNumber}`);
  };

  const handleDelete = (woNumber) => {
    showAlert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus Work Order ${woNumber}?`,
      'warning',
      () => {
        // TODO: Implement delete logic
        showAlert('Sukses', 'Work Order berhasil dihapus!', 'success', () => {
          loadWorkOrders();
        });
      }
    );
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

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesWoNumber = !filterWoNumber || wo.woNumber.toLowerCase().includes(filterWoNumber.toLowerCase());
    const matchesSoNumber = !filterSoNumber || wo.soNumber.toLowerCase().includes(filterSoNumber.toLowerCase());
    const matchesCustomer = !filterCustomer || wo.customer.toLowerCase().includes(filterCustomer.toLowerCase());
    const matchesWarehouse = !filterWarehouse || wo.warehouse.toLowerCase().includes(filterWarehouse.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    
    return matchesWoNumber && matchesSoNumber && matchesCustomer && matchesWarehouse && matchesStatus;
  });

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
                ) : filteredWorkOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada data Work Order
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkOrders.map((wo) => (
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
                            onClick={() => handleViewDetail(wo.woNumber)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(wo.woNumber)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
             </Card>
     </PageLayout>
   );
 }
