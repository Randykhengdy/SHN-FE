import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/hooks/useAlert";
import { useRole } from "@/hooks/useRole";
import RoleGuard from "@/components/RoleGuard";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import PageLayout from "@/components/PageLayout";

export default function ViewWorkOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  
  // Prevent multiple API calls
  const isLoadingRef = useRef(false);

  // Master data state
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);

  // Work Order Data
  const [workOrder, setWorkOrder] = useState(null);

  // Customer Information
  const [customerData, setCustomerData] = useState(null);

  // Work Order Details
  const [woNumber, setWoNumber] = useState("");
  const [woDate, setWoDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  // Item List
  const [items, setItems] = useState([]);
  


  // Load work order data (includes all master data)
  useEffect(() => {
    const loadData = async () => {
      // Prevent duplicate calls using ref
      if (isLoadingRef.current) {
        console.log('🔧 Skipping loadData - already loading (ref check)');
        return;
      }
      
      isLoadingRef.current = true;
      
      try {
        setLoading(true);

        // Load work order data (includes master data)
        console.log('🔧 Fetching work order data for ID:', id);
        console.log('🔧 API URL:', `${API_ENDPOINTS.workOrder}/${id}`);
        
        const response = await request(`${API_ENDPOINTS.workOrder}/${id}`, {
          method: 'GET'
        });

        console.log('🔍 Work Order API Response:', response);
        
        // Handle different response structures
        let woData = response.data || response;
        
        // If response is an array, take the first item
        if (Array.isArray(woData)) {
          woData = woData[0];
        }
        
        // If still no data, try different possible structures
        if (!woData && response.work_order) {
          woData = response.work_order;
        }
        if (!woData && response.workOrder) {
          woData = response.workOrder;
        }
        
        console.log('🔍 Work Order Data:', woData);
        
        if (!woData) {
          throw new Error('Work order data not found in response');
        }
        
        setWorkOrder(woData);

        // Extract master data from work order response
        console.log('🔧 Extracting master data from work order response...');
        
        // Get customer data from work order
        const customerData = woData.pelanggan || woData.customer || woData.client;
        if (customerData) {
          console.log('🔍 Customer data found:', customerData);
          setCustomerData(customerData);
        }

        // Get warehouse data from work order
        const warehouseData = woData.gudang || woData.warehouse;
        if (warehouseData) {
          console.log('🔍 Warehouse data found:', warehouseData);
          setWarehouseOptions([warehouseData]);
        }

        // Extract master data from items
        const itemsData = woData.workOrderItems || woData.items || woData.work_order_items || woData.orderItems || [];
        console.log('🔍 Items data:', itemsData);
        
        // Collect unique master data from items
        const masterData = {
          jenisBarang: [],
          bentukBarang: [],
          gradeBarang: [],
          units: []
        };

        itemsData.forEach(item => {
          // Add jenis barang if exists and not already added
          if (item.jenis_barang && !masterData.jenisBarang.find(jb => jb.id === item.jenis_barang.id)) {
            masterData.jenisBarang.push(item.jenis_barang);
          }
          
          // Add bentuk barang if exists and not already added
          if (item.bentuk_barang && !masterData.bentukBarang.find(bb => bb.id === item.bentuk_barang.id)) {
            masterData.bentukBarang.push(item.bentuk_barang);
          }
          
          // Add grade barang if exists and not already added
          if (item.grade_barang && !masterData.gradeBarang.find(gb => gb.id === item.grade_barang.id)) {
            masterData.gradeBarang.push(item.grade_barang);
          }
        });

        console.log('🔧 Master data extracted:', {
          jenisBarang: masterData.jenisBarang.length,
          bentukBarang: masterData.bentukBarang.length,
          gradeBarang: masterData.gradeBarang.length,
          warehouse: warehouseData ? 1 : 0
        });

        // Set master data options
        setItemTypeOptions(masterData.jenisBarang);
        setItemShapeOptions(masterData.bentukBarang);
        setItemGradeOptions(masterData.gradeBarang);

        // Set work order details
        console.log('🔍 Setting WO details:', {
          nomor_wo: woData.nomor_wo,
          tanggal_wo: woData.tanggal_wo,
          tanggal_selesai: woData.tanggal_selesai,
          prioritas: woData.prioritas,
          status: woData.status,
          assigned_to: woData.assigned_to,
          gudang: warehouseData,
          gudang_nama: warehouseData?.nama_gudang,
          gudang_nama_alt: warehouseData?.nama,
          gudang_label: warehouseData?.label
        });
        
        setWoNumber(woData.nomor_wo || woData.wo_number || woData.order_number || "");
        setWoDate(formatDateForInput(woData.tanggal_wo || woData.wo_date || woData.order_date));
        setDueDate(formatDateForInput(woData.tanggal_selesai || woData.due_date));
        setPriority(woData.prioritas || woData.priority || "");
        setStatus(woData.status || "");
        setAssignedTo(woData.assigned_to || woData.assignedTo || "");

        // Process items with included master data
        if (itemsData && itemsData.length > 0) {
          const mappedItems = itemsData.map(item => {
            console.log('🔍 Mapping item:', item);
            
            // Calculate total if not provided
            const qty = parseFloat(item.qty || item.quantity || item.jumlah || 0);
            const harga = parseFloat(item.harga || item.price || 0);
            const diskon = parseFloat(item.diskon || item.discount || 0);
            const subtotal = qty * harga;
            const discountAmount = subtotal * (diskon / 100);
            const total = subtotal - discountAmount;
            
            console.log('🔍 Item calculations:', {
              qty,
              harga,
              diskon,
              subtotal,
              discountAmount,
              total,
              originalTotal: item.total || item.subtotal
            });
            
            return {
              id: item.id,
              jenisBarang: item.jenis_barang?.nama_bentuk || 'N/A',
              bentukBarang: item.bentuk_barang?.nama_bentuk_barang || 'N/A',
              gradeBarang: item.grade_barang?.nama || 'N/A',
              panjang: item.panjang || item.length || 0,
              lebar: item.lebar || item.width || 0,
              diameter: item.diameter || 0,
              ketebalan: item.ketebalan || item.thickness || 0,
              berat: item.berat || item.weight || 0,
              qty: qty,
              harga: harga,
              diskon: diskon,
              satuan: item.satuan || 'N/A',
              catatan: item.catatan || item.note || item.notes || "",
              total: item.total || item.subtotal || total || 0
            };
          });
          console.log('🔍 Mapped items:', mappedItems);
          setItems(mappedItems);
        } else {
          console.log('🔍 No items found or items array is empty');
          setItems([]);
        }
      } catch (error) {
        console.error('Error loading work order:', error);
        showAlert("Error", "Gagal memuat data Work Order", "error");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };





  // Memoized calculations
  const { subtotal, totalDiscount, ppnAmount, grandTotal } = useMemo(() => {
    console.log('🔍 Calculating totals for items:', items);
    
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      console.log('🔍 Item total:', { item: item.jenisBarang, total: itemTotal });
      return sum + itemTotal;
    }, 0);
    
    const totalDiscount = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.total) || 0;
      const itemDiscount = parseFloat(item.diskon) || 0;
      const discountAmount = (itemTotal * itemDiscount / 100);
      console.log('🔍 Item discount:', { item: item.jenisBarang, total: itemTotal, discount: itemDiscount, discountAmount });
      return sum + discountAmount;
    }, 0);
    
    const ppnAmount = (subtotal - totalDiscount) * 0.11; // 11% PPN
    const grandTotal = subtotal - totalDiscount + ppnAmount;
    
    console.log('🔍 Final calculations:', {
      subtotal,
      totalDiscount,
      ppnAmount,
      grandTotal,
      itemsCount: items.length
    });
    
    return { subtotal, totalDiscount, ppnAmount, grandTotal };
  }, [items]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data Work Order...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Work Order tidak ditemukan</p>
          <Button onClick={() => navigate('/work-order')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout title="Detail Work Order" subtitle="PRODUKSI">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/work-order')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>

        {/* Work Order Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Informasi Work Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Nomor WO</Label>
                <Input 
                  value={woNumber} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal WO</Label>
                <Input 
                  value={woDate} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                <Input 
                  value={dueDate} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Prioritas</Label>
                <Input 
                  value={priority || 'N/A'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Input 
                  value={status || 'N/A'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Ditugaskan ke</Label>
                <Input 
                  value={assignedTo || 'N/A'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

                 {/* Customer Information */}
         <Card className="mb-6">
           <CardHeader>
             <CardTitle>Informasi Pelanggan</CardTitle>
           </CardHeader>
                       <CardContent>
              {customerData ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label className="text-sm font-medium text-gray-700">Kode Pelanggan</Label>
                   <Input 
                     value={customerData.kode || 'N/A'} 
                     disabled 
                     className="bg-gray-50"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-700">Nama Pelanggan</Label>
                   <Input 
                     value={customerData.nama_pelanggan || customerData.nama || customerData.name || 'N/A'} 
                     disabled 
                     className="bg-gray-50"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-700">Kota</Label>
                   <Input 
                     value={customerData.kota || 'N/A'} 
                     disabled 
                     className="bg-gray-50"
                   />
                 </div>
                 <div>
                   <Label className="text-sm font-medium text-gray-700">Telepon/HP</Label>
                   <Input 
                     value={customerData.telepon_hp || customerData.telepon || customerData.phone || 'N/A'} 
                     disabled 
                     className="bg-gray-50"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <Label className="text-sm font-medium text-gray-700">Contact Person</Label>
                   <Input 
                     value={customerData.contact_person || 'N/A'} 
                     disabled 
                     className="bg-gray-50"
                   />
                 </div>
               </div>
             ) : (
               <div className="text-center py-8 text-gray-500">
                 Data pelanggan tidak ditemukan
               </div>
             )}
           </CardContent>
         </Card>

        {/* Items Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daftar Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                                 <TableHeader className="table-header-standard">
                   <TableRow className="bg-gray-50">
                     <TableHead className="table-header-cell-standard">#</TableHead>
                     <TableHead className="table-header-cell-standard">Jenis Barang</TableHead>
                     <TableHead className="table-header-cell-standard">Bentuk</TableHead>
                     <TableHead className="table-header-cell-standard">Grade</TableHead>
                     <TableHead className="table-header-cell-standard">Dimensi</TableHead>
                     <TableHead className="table-header-cell-standard">Qty</TableHead>
                     <TableHead className="table-header-cell-standard">Luas/item</TableHead>
                     <TableHead className="table-header-cell-standard">Harga</TableHead>
                     <TableHead className="table-header-cell-standard">Satuan</TableHead>
                     <TableHead className="table-header-cell-standard">Diskon</TableHead>
                     <TableHead className="table-header-cell-standard">Total</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                                     {items.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                         Tidak ada item
                       </TableCell>
                     </TableRow>
                   ) : (
                     items.map((item, index) => {
                       // Calculate luas per item
                       const panjang = parseFloat(item.panjang) || 0;
                       const lebar = parseFloat(item.lebar) || 0;
                       const luasPerItem = panjang * lebar;
                       
                       // Format dimensi
                       const dimensi = `${panjang} x ${lebar} mm`;
                       
                       return (
                         <TableRow key={item.id || index} className="hover:bg-gray-50">
                           <TableCell className="font-medium">{index + 1}</TableCell>
                           <TableCell>{item.jenisBarang}</TableCell>
                           <TableCell>{item.bentukBarang}</TableCell>
                           <TableCell>{item.gradeBarang}</TableCell>
                           <TableCell>{dimensi}</TableCell>
                           <TableCell>{item.qty}</TableCell>
                           <TableCell>{luasPerItem.toFixed(2)} mm²</TableCell>
                           <TableCell>{formatCurrency(item.harga)}</TableCell>
                           <TableCell>{item.satuan}</TableCell>
                           <TableCell>{item.diskon}%</TableCell>
                           <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                         </TableRow>
                       );
                     })
                   )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Diskon:</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PPN (11%):</span>
                  <span className="font-semibold">{formatCurrency(ppnAmount)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Item:</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold text-blue-600">{status || 'Draft'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dibuat pada:</span>
                  <span className="font-semibold">{formatDate(workOrder.created_at)}</span>
                </div>
                {workOrder.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diupdate pada:</span>
                    <span className="font-semibold">{formatDate(workOrder.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" variant="outline" onClick={() => navigate('/work-order')}>
            Kembali ke List
          </Button>
          
          <RoleGuard roles={['admin', 'manager', 'supervisor']}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Print WO
            </Button>
          </RoleGuard>
        </div>
        
        {/* Alert Modal Component */}
        <AlertComponent />
      </PageLayout>
  );
}
