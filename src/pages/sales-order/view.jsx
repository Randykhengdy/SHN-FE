import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ArrowLeft, Calendar, Eye, Printer } from "lucide-react";
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
import SalesOrderLayout from "@/components/SalesOrderLayout";
import { generateSalesOrderPrintContent, openPrintDialog } from "@/lib/printUtils";

export default function ViewSalesOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  
  // Prevent multiple API calls
  const isLoadingRef = useRef(false);

  // Master data state
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);

  // Sales Order Data
  const [salesOrder, setSalesOrder] = useState(null);

  // Customer Information
  const [customerData, setCustomerData] = useState(null);

  // Sales Order Details
  const [soNumber, setSoNumber] = useState("");
  const [soDate, setSoDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [termOfPayment, setTermOfPayment] = useState("");
  const [originWarehouse, setOriginWarehouse] = useState("");

  // Item List
  const [items, setItems] = useState([]);
  


  // Load sales order data (includes all master data)
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

        // Load sales order data (includes master data)
        console.log('🔧 Fetching sales order data for ID:', id);
        console.log('🔧 API URL:', `${API_ENDPOINTS.salesOrder}/${id}`);
        
        const response = await request(`${API_ENDPOINTS.salesOrder}/${id}`, {
          method: 'GET'
        });

        console.log('🔍 Sales Order API Response:', response);
        
        // Handle different response structures
        let soData = response.data || response;
        
        // If response is an array, take the first item
        if (Array.isArray(soData)) {
          soData = soData[0];
        }
        
        // If still no data, try different possible structures
        if (!soData && response.sales_order) {
          soData = response.sales_order;
        }
        if (!soData && response.salesOrder) {
          soData = response.salesOrder;
        }
        
        console.log('🔍 Sales Order Data:', soData);
        
        if (!soData) {
          throw new Error('Sales order data not found in response');
        }
        
        setSalesOrder(soData);

        // Extract master data from sales order response
        console.log('🔧 Extracting master data from sales order response...');
        
        // Get customer data from sales order
        const customerData = soData.pelanggan || soData.customer || soData.client;
        if (customerData) {
          console.log('🔍 Customer data found:', customerData);
          setCustomerData(customerData);
        }

        // Get warehouse data from sales order
        const warehouseData = soData.gudang || soData.warehouse;
        if (warehouseData) {
          console.log('🔍 Warehouse data found:', warehouseData);
          setWarehouseOptions([warehouseData]);
        }

        // Extract master data from items
        const itemsData = soData.salesOrderItems || soData.items || soData.sales_order_items || soData.orderItems || [];
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

        // Set sales order details
        console.log('🔍 Setting SO details:', {
          nomor_so: soData.nomor_so,
          tanggal_so: soData.tanggal_so,
          tanggal_pengiriman: soData.tanggal_pengiriman,
          syarat_pembayaran: soData.syarat_pembayaran,
          gudang: warehouseData,
          gudang_nama: warehouseData?.nama_gudang,
          gudang_nama_alt: warehouseData?.nama,
          gudang_label: warehouseData?.label
        });
        
        setSoNumber(soData.nomor_so || soData.so_number || soData.order_number || "");
        setSoDate(formatDateForInput(soData.tanggal_so || soData.so_date || soData.order_date));
        setDeliveryDate(formatDateForInput(soData.tanggal_pengiriman || soData.delivery_date));
        setTermOfPayment(soData.syarat_pembayaran || soData.term_of_payment || "");
        
        // Set warehouse name from included data
        const warehouseName = warehouseData?.nama_gudang || warehouseData?.nama || 
                             warehouseData?.label || 'N/A';
        setOriginWarehouse(warehouseName);

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
              jenisBarang: item.jenis_barang?.nama_jenis_barang || item.jenis_barang?.nama_jenis || item.jenis_barang?.nama || 'N/A',
              bentukBarang: item.bentuk_barang?.nama_bentuk_barang || item.bentuk_barang?.nama_bentuk || item.bentuk_barang?.nama || 'N/A',
              gradeBarang: item.grade_barang?.nama_grade_barang || item.grade_barang?.nama || item.grade_barang?.nama_grade || 'N/A',
              panjang: item.panjang || item.length || 0,
              lebar: item.lebar || item.width || 0,
              diameter: item.diameter || 0,
              ketebalan: item.tebal || item.ketebalan || item.thickness || 0,
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
        console.error('Error loading sales order:', error);
        showAlert("Error", "Gagal memuat data Sales Order", "error");
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

  // Handle print sales order
  const handlePrintSalesOrder = async () => {
    try {
      setPrintLoading(true);
      
      if (!salesOrder) {
        showAlert("Error", "Data sales order tidak ditemukan", "error");
        return;
      }

      // Prepare print data
      // Map customer data to match print template expectations
      // Note: API returns pelanggan with nama_pelanggan, alamat, telepon
      // But form UI uses kota and telepon_hp, so we map both
      const mappedCustomer = customerData ? {
        nama_customer: customerData.nama_pelanggan || customerData.nama || customerData.name || 'N/A',
        alamat: customerData.alamat || customerData.address || customerData.kota || 'N/A',
        telepon: customerData.telepon || customerData.telepon_hp || customerData.phone || 'N/A',
        email: customerData.email || customerData.email_address || 'N/A'
      } : null;

      const printData = {
        nomor_so: soNumber,
        tanggal_so: soDate,
        tanggal_pengiriman: deliveryDate,
        term_of_payment: termOfPayment,
        gudang_asal: originWarehouse,
        customer: mappedCustomer,
        items: items.map(item => {
          // Build dimensi_potong from panjang, lebar, and tebal/ketebalan
          const panjang = parseFloat(item.panjang) || 0;
          const lebar = parseFloat(item.lebar) || 0;
          const tebal = parseFloat(item.ketebalan) || 0; // ketebalan already mapped from tebal
          
          let dimensi_potong = '-';
          if (lebar > 0) {
            dimensi_potong = `${panjang} x ${lebar} x ${tebal} mm`;
          } else {
            dimensi_potong = `${panjang} x ${tebal} mm`;
          }
          
          // Use satuan as unit (handle 'N/A' case)
          const unit = (item.satuan && item.satuan !== 'N/A') ? item.satuan : (item.unit || '-');
          
          // Calculate total_kg from berat (weight) if available
          const total_kg = parseFloat(item.berat) || 0;
          
          return {
            nama_item: item.jenisBarang || item.nama_item,
            bentuk_barang: item.bentukBarang || item.bentuk_barang,
            grade_barang: item.gradeBarang || item.grade_barang,
            dimensi_potong: dimensi_potong,
            unit: unit,
            qty: item.qty || item.quantity || 0,
            total_kg: total_kg,
            harga_per_unit: item.harga || item.harga_per_unit || 0,
            total_harga: item.total || item.total_harga || 0
          };
        }),
        total_harga: subtotal,
        discount: totalDiscount,
        ppn: ppnAmount,
        grand_total: grandTotal
      };

      console.log('🖨️ Print data:', printData);

      // Generate printable HTML and open print dialog (no download)
      const printContent = generateSalesOrderPrintContent(printData);
      openPrintDialog(printContent);
    } catch (error) {
      console.error('Error printing sales order:', error);
      showAlert("Error", "Gagal generate PDF Sales Order", "error");
    } finally {
      setPrintLoading(false);
    }
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
          <p className="mt-4 text-gray-600">Memuat data Sales Order...</p>
        </div>
      </div>
    );
  }

  if (!salesOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sales Order tidak ditemukan</p>
          <Button onClick={() => navigate('/sales-order')} className="mt-4">
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SalesOrderLayout title="Detail Sales Order" subtitle="TRANSAKSI">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/sales-order')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
      </div>

        {/* Sales Order Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Informasi Sales Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Nomor SO</Label>
                <Input 
                  value={soNumber} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal SO</Label>
                <Input 
                  value={soDate} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tanggal Pengiriman</Label>
                <Input 
                  value={deliveryDate} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
                             <div>
                 <Label className="text-sm font-medium text-gray-700">Termin Pembayaran</Label>
                 <Input 
                   value={termOfPayment || 'N/A'} 
                   disabled 
                   className="bg-gray-50"
                 />
               </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Asal Gudang</Label>
                <Input 
                  value={originWarehouse} 
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
                     <TableHead className="table-header-cell-standard">Diskon</TableHead>
                     <TableHead className="table-header-cell-standard">Total</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                                     {items.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                         Tidak ada item
                       </TableCell>
                     </TableRow>
                   ) : (
                     items.map((item, index) => {
                       // Calculate luas per item
                       const panjang = parseFloat(item.panjang) || 0;
                       const lebar = parseFloat(item.lebar) || 0;
                       const tebal = parseFloat(item.ketebalan) || 0;
                       const luasPerItem = panjang * lebar * tebal;
                       
                       // Format dimensi
                       const dimensi = lebar > 0
                         ? `${panjang} x ${lebar} x ${tebal} mm`
                         : `${panjang} x ${tebal} mm`;
                       
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
                  <span className="font-semibold text-blue-600">Draft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal SO:</span>
                  <span className="font-semibold">{formatDate(salesOrder.tanggal_so)}</span>
                </div>
                {salesOrder.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diupdate pada:</span>
                    <span className="font-semibold">{formatDate(salesOrder.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <Button size="lg" variant="outline" onClick={() => navigate('/sales-order')}>
            Kembali ke List
          </Button>
          
          <RoleGuard roles={['admin', 'manager', 'supervisor']}>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handlePrintSalesOrder}
              disabled={printLoading}
            >
              {printLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Cetak
            </Button>
          </RoleGuard>
        </div>
        
        {/* Alert Modal Component */}
        <AlertComponent />
      </SalesOrderLayout>
  );
}
