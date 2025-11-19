import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ArrowLeft, Calendar, Eye, Edit, Save, X } from "lucide-react";
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
import { workOrderService } from "@/services/workOrderService";
import PageLayout from "@/components/PageLayout";
import PelaksanaViewModal from "@/components/modals/PelaksanaViewModal";
import SaranViewModal from "@/components/modals/SaranViewModal";
import { openPrintDialog, generateWOPlanningPrintContent } from "@/lib/printUtils";
import CustomAlert from "@/components/modals/CustomAlert";
// import { Switch } from "@/components/ui/switch";

export default function ViewWorkOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  // const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  
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
  const [pelaksanaData, setPelaksanaData] = useState([]);
  const [saranData, setSaranData] = useState([]);
  
  // Modal states
  const [pelaksanaModalOpen, setPelaksanaModalOpen] = useState(false);
  const [saranModalOpen, setSaranModalOpen] = useState(false);
  const [selectedItemPelaksana, setSelectedItemPelaksana] = useState(null);
  const [selectedItemSaran, setSelectedItemSaran] = useState(null);
  const [selectedItemInfo, setSelectedItemInfo] = useState(null);
  const [loadingPelaksana, setLoadingPelaksana] = useState(false);
  const [loadingSaran, setLoadingSaran] = useState(false);
  
  // Modal handlers
  const handlePelaksanaClick = (item) => {
    setSelectedItemInfo(item);
    setSelectedItemPelaksana(item.pelaksana || []);
    setPelaksanaModalOpen(true);
  };

  const handleSaranClick = (item) => {
    setSelectedItemInfo(item);
    setSelectedItemSaran(item.saran_plat_dasar || []);
    setSaranModalOpen(true);
  };

  const closePelaksanaModal = () => {
    setPelaksanaModalOpen(false);
    setSelectedItemPelaksana(null);
    setSelectedItemInfo(null);
  };

  const closeSaranModal = () => {
    setSaranModalOpen(false);
    setSelectedItemSaran(null);
    setSelectedItemInfo(null);
  };

  // Handle Print WO (Planning)
  const doPrint = async () => {
    try {
      setLoading(true);
      let canvasImages = [];
      try {
        const imagesResponse = await workOrderService.getWorkOrderImages(id);
        canvasImages = imagesResponse.data?.images || [];
      } catch (_) {}
      const printData = {
        nomor_wo: workOrder?.nomor_wo || woNumber || 'N/A',
        tanggal_wo: workOrder?.tanggal_wo || woDate || 'N/A',
        due_date: workOrder?.tanggal_target || dueDate || 'N/A',
        priority: workOrder?.prioritas || priority || 'N/A',
        status: workOrder?.status || status || 'N/A',
        assigned_to: workOrder?.handover_method || assignedTo || 'N/A',
        customer: workOrder?.pelanggan,
        warehouse: workOrder?.gudang,
        items: items.map(item => ({
          id: item.id,
          wo_item_unique_id: item.wo_item_unique_id || item.id,
          nama_item: item.jenisBarang?.nama_jenis_barang || item.jenisBarang?.nama || item.nama_item || 'N/A',
          jenisBarang: item.jenisBarang,
          bentukBarang: item.bentukBarang,
          gradeBarang: item.gradeBarang,
          dimensi: item.bentukBarang?.dimensi || `${item.panjang || 0}x${item.lebar || 0}x${item.ketebalan || 0}mm`,
          qtyPlanning: item.qty || 0,
          jenisPotongan: item.jenisPotongan || item.jenis_potongan,
          keterangan: item.catatan || item.keterangan || 'N/A'
        })),
        canvasImages
      };
      const html = generateWOPlanningPrintContent(printData, { includeImages });
      openPrintDialog(html);
    } catch (error) {
      console.error('❌ Error saat membuka dialog cetak WO Planning:', error);
      showAlert('Gagal membuka dialog cetak. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };
  


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

        // Load work order data using workOrderService
        console.log('🔧 Fetching work order data for ID:', id);
        
        const response = await workOrderService.getWorkOrderById(id);

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

        // Extract master data from work order response
        console.log('🔧 Extracting master data from work order response...');
        
        // Get customer data from work order
        const customerData = woData.pelanggan || woData.customer || woData.client || woData.salesOrder?.pelanggan;
        if (customerData) {
          console.log('🔍 Customer data found:', customerData);
          setCustomerData(customerData);
        }

        // Get warehouse data from work order
        const warehouseData = woData.gudang || woData.warehouse || woData.salesOrder?.gudang;
        if (warehouseData) {
          console.log('🔍 Warehouse data found:', warehouseData);
          setWarehouseOptions([warehouseData]);
        }

        // Get sales order data from work order
        const salesOrderData = woData.sales_order || woData.salesOrder;
        console.log('🔍 Sales Order data found:', salesOrderData);
        
        setWorkOrder({
          ...woData,
          sales_order: salesOrderData,
          nomor_so: salesOrderData?.nomor_so || woData.nomor_so,
          pelanggan: customerData,
          gudang: warehouseData
        });

        // Pelaksana data is already available in workOrderPlanningItems, no separate API call needed

        // Process saran data to show item ID and quantities
        const processedSaranData = [];
        
        if (woData.workOrderPlanningItems && Array.isArray(woData.workOrderPlanningItems)) {
          woData.workOrderPlanningItems.forEach(item => {
            if (item.saran_plat_dasar && Array.isArray(item.saran_plat_dasar)) {
              item.saran_plat_dasar.forEach(saran => {
                processedSaranData.push({
                  saranItemId: saran.item_barang?.id,
                  itemName: saran.item_barang?.nama_item_barang || 'Unknown Item',
                  quantity: parseFloat(saran.quantity) || 0,
                  targetQuantity: parseFloat(saran.quantity) || 0,
                  woItemId: item.wo_item_unique_id,
                  isSelected: saran.is_selected
                });
              });
            }
          });
        }
        
        setSaranData(processedSaranData);


        // Extract master data from items
        const itemsData = woData.workOrderPlanningItems || woData.workOrderItems || woData.items || woData.work_order_items || woData.orderItems || [];
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
          if (item.jenisBarang && !masterData.jenisBarang.find(jb => jb.id === item.jenisBarang.id)) {
            masterData.jenisBarang.push(item.jenisBarang);
          }
          
          // Add bentuk barang if exists and not already added
          if (item.bentukBarang && !masterData.bentukBarang.find(bb => bb.id === item.bentukBarang.id)) {
            masterData.bentukBarang.push(item.bentukBarang);
          }
          
          // Add grade barang if exists and not already added
          if (item.gradeBarang && !masterData.gradeBarang.find(gb => gb.id === item.gradeBarang.id)) {
            masterData.gradeBarang.push(item.gradeBarang);
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
          tanggal_target: woData.tanggal_target,
          prioritas: woData.prioritas,
          status: woData.status,
          handover_method: woData.handover_method,
          gudang: warehouseData,
          gudang_nama: warehouseData?.nama_gudang || warehouseData?.nama,
          salesOrder: woData.salesOrder
        });

        // Set work order state with complete data
        setWorkOrder({
          ...woData,
          gudang: warehouseData,
          gudang_nama: warehouseData?.nama_gudang || warehouseData?.nama,
          pelanggan: customerData,
          pelanggan_nama: customerData?.nama_pelanggan || customerData?.nama || customerData?.name,
          sales_order: salesOrderData,
          nomor_so: salesOrderData?.nomor_so
        });
        
        const currentWoNumber = woData.nomor_wo || woData.wo_number || woData.order_number || "";
        setWoNumber(currentWoNumber);
        setWoDate(formatDateForInput(woData.tanggal_wo || woData.wo_date || woData.order_date));
        setDueDate(formatDateForInput(woData.tanggal_target || woData.due_date));
        setPriority(woData.prioritas || woData.priority || "");
        setStatus(woData.status || "");
        setAssignedTo(woData.handover_method || woData.assignedTo || "");

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
              wo_item_unique_id: item.wo_item_unique_id || item.work_order_planning_item_id || item.wo_item_id || item.item_id || item.id,
              jenisBarang: item.jenis_barang || item.jenisBarang,
              bentukBarang: item.bentuk_barang || item.bentukBarang,
              gradeBarang: item.grade_barang || item.gradeBarang,
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
              total: item.total || item.subtotal || total || 0,
              jenis_potongan: item.jenis_potongan || 'potongan',
              // Include pelaksana and saran data from API
              pelaksana: item.pelaksana || [],
              saran_plat_dasar: item.saran_plat_dasar || []
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
                <Label className="text-sm font-medium text-gray-700">
                  Nomor WO
                </Label>
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
                <Label className="text-sm font-medium text-gray-700">Tanggal Target</Label>
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
                <Label className="text-sm font-medium text-gray-700">Metode Handover</Label>
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

        {/* Warehouse Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Gudang</CardTitle>
          </CardHeader>
          <CardContent>
            {warehouseOptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nama Gudang</Label>
                  <Input 
                    value={warehouseOptions[0]?.nama_gudang || warehouseOptions[0]?.nama || 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Alamat</Label>
                  <Input 
                    value={warehouseOptions[0]?.alamat || 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Data gudang tidak ditemukan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Order Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Sales Order</CardTitle>
          </CardHeader>
          <CardContent>
            {workOrder?.sales_order ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nomor SO</Label>
                  <Input 
                    value={workOrder.sales_order.nomor_so || workOrder.nomor_so || 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tanggal SO</Label>
                  <Input 
                    value={workOrder.sales_order.tanggal_so ? formatDate(workOrder.sales_order.tanggal_so) : 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tanggal Pengiriman</Label>
                  <Input 
                    value={workOrder.sales_order.tanggal_pengiriman ? formatDate(workOrder.sales_order.tanggal_pengiriman) : 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Metode Handover</Label>
                  <Input 
                    value={workOrder.sales_order.handover_method || 'N/A'} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Data sales order tidak ditemukan
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
                    <TableHead className="table-header-cell-standard">Tipe Potongan</TableHead>
                    <TableHead className="table-header-cell-standard">Diskon</TableHead>
                    <TableHead className="table-header-cell-standard">Total</TableHead>
                    <TableHead className="table-header-cell-standard">Pelaksana</TableHead>
                    <TableHead className="table-header-cell-standard">Item Barang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-gray-500">
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
                      
                      // Get pelaksana data for this item
                      const itemPelaksana = pelaksanaData.find(p => p.id === item.pelaksana_id) || null;
                      
                      // Get saran relasi data from API response (saran_plat_dasar)
                      const itemSaranRelasi = (item.saran_plat_dasar || []).map(saran => ({
                        saranItemId: saran.item_barang?.id || saran.id,
                        itemName: saran.item_barang?.nama_item_barang || 'Unknown Item',
                        quantity: parseFloat(saran.quantity) || 0,
                        targetQuantity: item.qty || 0,
                        woItemId: item.id || index,
                        isSelected: saran.is_selected
                      }));
                      
                      // Prepare pelaksana data for modal
                      const itemPelaksanaArray = itemPelaksana ? [itemPelaksana] : (item.pelaksana || []);
                      
                      return (
                        <TableRow key={item.id || index} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{item.jenisBarang?.nama_jenis_barang || item.jenisBarang?.nama || 'N/A'}</TableCell>
                          <TableCell>{item.bentukBarang?.nama_bentuk_barang || item.bentukBarang?.nama_bentuk || item.bentukBarang?.nama || 'N/A'}</TableCell>
                          <TableCell>{item.gradeBarang?.nama_grade_barang || item.gradeBarang?.nama_grade || item.gradeBarang?.nama || 'N/A'}</TableCell>
                          <TableCell>{dimensi}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{luasPerItem.toFixed(2)} mm²</TableCell>
                          <TableCell>{formatCurrency(item.harga)}</TableCell>
                          <TableCell>{item.satuan}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.jenis_potongan === 'potongan' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.jenis_potongan === 'potongan' ? 'Potongan' : 'Utuh'}
                            </span>
                          </TableCell>
                          <TableCell>{item.diskon}%</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            {itemPelaksanaArray && itemPelaksanaArray.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePelaksanaClick({...item, pelaksana: itemPelaksanaArray})}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Lihat ({itemPelaksanaArray.length})
                              </Button>
                            ) : (
                              <span className="text-gray-400">Belum ditentukan</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {itemSaranRelasi && itemSaranRelasi.length > 0 ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaranClick({...item, saran_plat_dasar: itemSaranRelasi})}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Lihat ({itemSaranRelasi.length})
                              </Button>
                            ) : (
                              <span className="text-gray-400">Tidak ada relasi</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary (right side only) */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" variant="outline" onClick={() => navigate('/work-order')}>
            Kembali ke List
          </Button>
          
          <RoleGuard roles={['admin', 'manager', 'supervisor']}>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={doPrint}
              disabled={loading}
            >
              {loading ? 'Menyiapkan cetak...' : 'Cetak WO'}
            </Button>
          </RoleGuard>
        </div>
        
        <AlertComponent />
        
        {/* Modals */}
        <PelaksanaViewModal
          isOpen={pelaksanaModalOpen}
          onClose={closePelaksanaModal}
          pelaksanaData={selectedItemPelaksana}
          itemInfo={selectedItemInfo}
        />
        
        <SaranViewModal
          isOpen={saranModalOpen}
          onClose={closeSaranModal}
          saranData={selectedItemSaran}
          itemInfo={selectedItemInfo}
        />
      </PageLayout>
  );
}
