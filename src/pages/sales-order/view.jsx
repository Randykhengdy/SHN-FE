import React, { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CustomerInfoTabs from "@/components/CustomerInfoTabs";
import { 
  getTermOptions, 
  getGudangOptions, 
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions, 
  getUnitOptions 
} from "@/services/masterDataService";
import { useAlert } from "@/hooks/useAlert";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";

export default function ViewSalesOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, AlertComponent } = useAlert();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMasterData, setLoadingMasterData] = useState(true);

  // Master data state
  const [termOptions, setTermOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  // Sales Order Data
  const [salesOrder, setSalesOrder] = useState(null);

  // Customer Information
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Sales Order Details
  const [soNumber, setSoNumber] = useState("");
  const [soDate, setSoDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [termOfPayment, setTermOfPayment] = useState("");
  const [originWarehouse, setOriginWarehouse] = useState("");

  // Item List
  const [items, setItems] = useState([]);

  // Load master data and sales order data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setLoadingMasterData(true);

        // Load master data for mapping
        const [
          terms,
          gudang,
          jenisBarang,
          bentukBarang,
          gradeBarang,
          units
        ] = await Promise.all([
          getTermOptions(),
          getGudangOptions(),
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getUnitOptions()
        ]);

        setTermOptions(terms);
        setWarehouseOptions(gudang);
        setItemTypeOptions(jenisBarang);
        setItemShapeOptions(bentukBarang);
        setItemGradeOptions(gradeBarang);
        setUnitOptions(units);

        // Load sales order data
        const response = await request(`${API_ENDPOINTS.salesOrder}/${id}`, {
          method: 'GET'
        });

        const soData = response.data;
        setSalesOrder(soData);

        // Set customer information
        if (soData.pelanggan) {
          setSelectedCustomer(soData.pelanggan);
          setCustomerName(soData.pelanggan.nama_pelanggan || "");
          setCustomerPhone(soData.pelanggan.telepon || "");
          setCustomerEmail(soData.pelanggan.email || "");
          setCustomerAddress(soData.pelanggan.alamat || "");
        }

        // Set sales order details
        setSoNumber(soData.nomor_so || "");
        setSoDate(formatDateForInput(soData.tanggal_so));
        setDeliveryDate(formatDateForInput(soData.tanggal_pengiriman));
        setTermOfPayment(soData.syarat_pembayaran || "");
        setOriginWarehouse(soData.gudang?.nama_gudang || "");

        // Set items
        if (soData.salesOrderItems && soData.salesOrderItems.length > 0) {
          const mappedItems = soData.salesOrderItems.map(item => ({
            id: item.id,
            jenisBarang: getMasterDataName(item.jenis_barang_id, jenisBarang),
            bentukBarang: getMasterDataName(item.bentuk_barang_id, bentukBarang),
            gradeBarang: getMasterDataName(item.grade_barang_id, gradeBarang),
            panjang: item.panjang || 0,
            lebar: item.lebar || 0,
            diameter: item.diameter || 0,
            ketebalan: item.ketebalan || 0,
            berat: item.berat || 0,
            qty: item.qty || 0,
            harga: item.harga || 0,
            diskon: item.diskon || 0,
            satuan: getMasterDataName(item.unit_id, units),
            catatan: item.catatan || "",
            total: item.total || 0
          }));
          setItems(mappedItems);
        }

      } catch (error) {
        console.error('Error loading sales order:', error);
        showAlert("Error", "Gagal memuat data Sales Order", "error");
      } finally {
        setLoading(false);
        setLoadingMasterData(false);
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

  const getMasterDataName = (id, options) => {
    const option = options.find(opt => opt.value === id);
    return option ? option.label : 'N/A';
  };

  const getTermName = (termValue) => {
    const term = termOptions.find(t => t.value === termValue);
    return term ? term.label : termValue;
  };

  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouseOptions.find(w => w.value === warehouseId);
    return warehouse ? warehouse.label : 'N/A';
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + ((item.total * item.diskon / 100) || 0), 0);
  const ppnAmount = (subtotal - totalDiscount) * 0.11; // 11% PPN
  const grandTotal = subtotal - totalDiscount + ppnAmount;

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/sales-order')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
            <div>
              <div className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">
                TRANSAKSI
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Sales Order</h1>
            </div>
          </div>
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
                <Label className="text-sm font-medium text-gray-700">Syarat Pembayaran</Label>
                <Input 
                  value={getTermName(termOfPayment)} 
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
            <CustomerInfoTabs
              selectedCustomer={selectedCustomer}
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              customerAddress={customerAddress}
              disabled={true}
            />
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
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">No</TableHead>
                    <TableHead className="font-semibold">Jenis Barang</TableHead>
                    <TableHead className="font-semibold">Bentuk</TableHead>
                    <TableHead className="font-semibold">Grade</TableHead>
                    <TableHead className="font-semibold text-center">Panjang</TableHead>
                    <TableHead className="font-semibold text-center">Lebar</TableHead>
                    <TableHead className="font-semibold text-center">Diameter</TableHead>
                    <TableHead className="font-semibold text-center">Ketebalan</TableHead>
                    <TableHead className="font-semibold text-center">Berat</TableHead>
                    <TableHead className="font-semibold text-center">Qty</TableHead>
                    <TableHead className="font-semibold text-center">Harga</TableHead>
                    <TableHead className="font-semibold text-center">Diskon</TableHead>
                    <TableHead className="font-semibold text-center">Satuan</TableHead>
                    <TableHead className="font-semibold text-center">Total</TableHead>
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
                    items.map((item, index) => (
                      <TableRow key={item.id || index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{item.jenisBarang}</TableCell>
                        <TableCell>{item.bentukBarang}</TableCell>
                        <TableCell>{item.gradeBarang}</TableCell>
                        <TableCell className="text-center">{item.panjang} mm</TableCell>
                        <TableCell className="text-center">{item.lebar} mm</TableCell>
                        <TableCell className="text-center">{item.diameter} mm</TableCell>
                        <TableCell className="text-center">{item.ketebalan} mm</TableCell>
                        <TableCell className="text-center">{item.berat} kg</TableCell>
                        <TableCell className="text-center">{item.qty}</TableCell>
                        <TableCell className="text-center">{formatCurrency(item.harga)}</TableCell>
                        <TableCell className="text-center">{item.diskon}%</TableCell>
                        <TableCell className="text-center">{item.satuan}</TableCell>
                        <TableCell className="text-center font-semibold">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))
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
                  <span className="text-gray-600">Dibuat pada:</span>
                  <span className="font-semibold">{formatDate(salesOrder.created_at)}</span>
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
        
        {/* Alert Modal Component */}
        <AlertComponent />
      </div>
    </div>
  );
}
