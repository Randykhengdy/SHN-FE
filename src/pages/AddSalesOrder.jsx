import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, FileText, Eye, Trash2, ArrowLeft, Calendar, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CustomerInfoTabs from "@/components/CustomerInfoTabs";
import DataTableModal from "@/components/modals/DataTableModal";
import SearchSelect from "@/components/ui/search-select";
import { 
  getTermOptions, 
  getGudangOptions, 
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions, 
  getUnitOptions 
} from "@/services/masterDataService";
import { useAlert } from "@/hooks/useAlert";

export default function AddSalesOrderPage() {
  const { showAlert, showConfirm, AlertComponent } = useAlert();
  
  // Master data state
  const [termOptions, setTermOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  // Loading states
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingItemType, setLoadingItemType] = useState(false);
  const [loadingItemShape, setLoadingItemShape] = useState(false);
  const [loadingItemGrade, setLoadingItemGrade] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Customer Information
  // Customer Information
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingTerm(true);
        setLoadingWarehouse(true);
        setLoadingItemType(true);
        setLoadingItemShape(true);
        setLoadingItemGrade(true);
        setLoadingUnit(true);

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
      } catch (error) {
        console.error('Error loading master data:', error);
      } finally {
        setLoadingTerm(false);
        setLoadingWarehouse(false);
        setLoadingItemType(false);
        setLoadingItemShape(false);
        setLoadingItemGrade(false);
        setLoadingUnit(false);
      }
    };

    loadMasterData();
  }, []);

  // Sales Order Details
  const [soNumber, setSoNumber] = useState("SO-20250825-001");
  const [soDate, setSoDate] = useState("2025-08-24");
  const [deliveryDate, setDeliveryDate] = useState("2025-08-31");
  const [termOfPayment, setTermOfPayment] = useState("cash");
  const [originWarehouse, setOriginWarehouse] = useState("");

  // Item Input Form
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemDiameter, setItemDiameter] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemType, setItemType] = useState("");
  const [itemShape, setItemShape] = useState("");
  const [selectedShape, setSelectedShape] = useState(null);
  const [itemGrade, setItemGrade] = useState("");
  const [itemPrice, setItemPrice] = useState("Auto dari jenis plat");
  const [itemUnit, setItemUnit] = useState("per-dimensi");
  const [itemDiscount, setItemDiscount] = useState("0");
  const [itemNotes, setItemNotes] = useState("");

  // Modal state
  const [shapeModalOpen, setShapeModalOpen] = useState(false);

  // Calculated values
  const [itemThickness, setItemThickness] = useState("- mm");
  const [itemArea, setItemArea] = useState("0.00 m²");
  const [itemPricePerUnit, setItemPricePerUnit] = useState("Rp 0/m²");
  const [itemTotal, setItemTotal] = useState("Rp 0");

  // Item List
  const [items, setItems] = useState([]);

  // Calculate item area and total
  useEffect(() => {
    const length = parseFloat(itemLength) || 0;
    const width = parseFloat(itemWidth) || 0;
    const diameter = parseFloat(itemDiameter) || 0;
    const qty = parseInt(itemQty) || 0;
    const discount = parseFloat(itemDiscount) || 0;

    let area = 0;
    let areaPerItem = "0.00";

    // Calculate area based on selected shape dimension
    if (selectedShape?.dimensi === "1D") {
      // 1D items (AS, CANAL U) - use diameter or length
      if (diameter > 0) {
        // For circular 1D items
        const radius = diameter / 2;
        area = Math.PI * radius * radius;
        areaPerItem = area.toFixed(2);
      } else if (length > 0) {
        // For linear 1D items
        area = length;
        areaPerItem = area.toFixed(2);
      }
    } else if (selectedShape?.dimensi === "2D") {
      // 2D items (PLAT) - use length * width
      area = length * width;
      areaPerItem = area.toFixed(2);
    }

    const pricePerUnit = 50000; // Mock price
    const totalBeforeDiscount = area * pricePerUnit * qty;
    const discountAmount = totalBeforeDiscount * (discount / 100);
    const totalAfterDiscount = totalBeforeDiscount - discountAmount;

    setItemArea(`${areaPerItem} m²`);
    setItemPricePerUnit(`Rp ${pricePerUnit.toLocaleString()}/m²`);
    setItemTotal(`Rp ${totalAfterDiscount.toLocaleString()}`);
  }, [itemLength, itemWidth, itemDiameter, selectedShape, itemQty, itemDiscount]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.nama);
    setCustomerPhone(customer.telepon);
    setCustomerEmail(customer.email);
    setCustomerAddress(customer.alamat);
  };

  const handleFillTestData = () => {
    setCustomerName("PT Test Customer");
    setCustomerPhone("08123456789");
    setCustomerEmail("test@customer.com");
    setCustomerAddress("Jl. Test No. 123, Jakarta");
    setOriginWarehouse("gudang-utama");
    setItemType("plat-besi");
    setItemShape("persegi");
    setItemGrade("grade-a");
  };

  const handleAddTestItem = () => {
    const testItem = {
      id: Date.now(),
      jenisBarang: "Plat Besi",
      bentuk: "Persegi",
      grade: "Grade A",
      dimensi: "2.00 x 1.50",
      qty: 2,
      luasPerItem: "3.00 m²",
      harga: "Rp 50,000/m²",
      satuan: "per dimensi",
      diskon: "5%",
      total: "Rp 285,000"
    };
    setItems([...items, testItem]);
  };

  const handleAddItem = () => {
    try {
      // Validation based on selected shape
      if (!itemType || !selectedShape || !itemGrade) {
        showAlert("Peringatan", "Mohon lengkapi data item", "warning");
        return;
      }

      if (selectedShape.dimensi === "1D") {
        if (!itemDiameter && !itemLength) {
          showAlert("Peringatan", "Mohon isi diameter atau panjang untuk bentuk 1D", "warning");
          return;
        }
      } else if (selectedShape.dimensi === "2D") {
        if (!itemLength || !itemWidth) {
          showAlert("Peringatan", "Mohon isi panjang dan lebar untuk bentuk 2D", "warning");
          return;
        }
      }

    // Create dimension string based on shape
    let dimensiString = "";
    if (selectedShape.dimensi === "1D") {
      if (itemDiameter) {
        dimensiString = `Diameter: ${itemDiameter}m`;
      } else {
        dimensiString = `Panjang: ${itemLength}m`;
      }
    } else {
      dimensiString = `${itemLength} x ${itemWidth}`;
    }

    const newItem = {
      id: Date.now(),
      // For display purposes
      jenisBarang: itemTypeOptions.find(opt => opt.value === itemType)?.label || itemType,
      bentuk: selectedShape.nama,
      grade: itemGradeOptions.find(opt => opt.value === itemGrade)?.label || itemGrade,
      dimensi: dimensiString,
      qty: parseInt(itemQty),
      luasPerItem: itemArea,
      harga: itemPricePerUnit,
      satuan: unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit,
      diskon: `${itemDiscount}%`,
      total: itemTotal,
      // For API submission (store the actual values)
      jenisBarangId: itemType,
      bentukBarangId: selectedShape.id,
      gradeBarangId: itemGrade,
      panjang: parseFloat(itemLength) || 0,
      lebar: parseFloat(itemWidth) || 0,
      diameter: parseFloat(itemDiameter) || null,
      satuan: itemUnit, // This will be the kode string from static API
      diskonPercent: parseFloat(itemDiscount) || 0,
      catatan: itemNotes
    };

    setItems([...items, newItem]);

    // Reset form
    setItemLength("");
    setItemWidth("");
    setItemDiameter("");
    setItemQty("1");
    setItemType("");
    setItemShape("");
    setSelectedShape(null);
    setItemGrade("");
    setItemDiscount("0");
    setItemNotes("");
    } catch (error) {
      console.error('Error adding item:', error);
      showAlert("Error", "Terjadi kesalahan saat menambahkan item", "error");
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleTestSimpanSO = () => {
    console.log("Testing save SO...");
    
    // Prepare data for API submission
    const salesOrderData = {
      header: {
        soNumber: soNumber,
        soDate: soDate,
        deliveryDate: deliveryDate,
        termOfPayment: termOfPayment, // String from static API
        originWarehouseId: originWarehouse,
        customerId: selectedCustomer?.id
      },
      items: items.map(item => ({
        jenisBarangId: item.jenisBarangId,
        bentukBarangId: item.bentukBarangId,
        gradeBarangId: item.gradeBarangId,
        panjang: item.panjang,
        lebar: item.lebar,
        diameter: item.diameter,
        qty: item.qty,
        luasPerItem: parseFloat(item.luasPerItem.replace(' m²', '')) || 0,
        hargaPerUnit: parseInt(item.harga.replace(/[^\d]/g, '')) || 0,
        satuan: item.satuan, // String from static API
        diskonPercent: item.diskonPercent,
        totalHarga: parseInt(item.total.replace(/[^\d]/g, '')) || 0,
        catatan: item.catatan
      })),
      summary: {
        subtotal: subtotal,
        totalDiskon: totalDiscount,
        ppnPercent: 11.0,
        ppnAmount: ppn,
        totalHargaSO: totalHargaSO
      }
    };
    
    console.log("Data yang akan dikirim ke API:", salesOrderData);
    showAlert("Sukses", "Test Simpan SO berhasil! Cek console untuk melihat data.", "success");
  };

  const handleBackToList = () => {
    // Navigate back to sales order list
    window.history.back();
  };

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
  };

  // Column configuration for shape modal
  const shapeColumns = [
    { key: 'id', label: 'ID' },
    { key: 'kode', label: 'Kode' },
    { key: 'nama', label: 'Nama' },
    { 
      key: 'dimensi', 
      label: 'Dimensi',
      type: 'badge',
      badgeColor: (value) => value === '1D' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    }
  ];

  // Calculate summary
  const subtotal = items.reduce((sum, item) => {
    try {
      const total = parseInt(item.total.replace(/[^\d]/g, '')) || 0;
      return sum + total;
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return sum;
    }
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    try {
      const total = parseInt(item.total.replace(/[^\d]/g, '')) || 0;
      const discountPercent = parseInt(item.diskon.replace('%', '')) || 0;
      return sum + (total * discountPercent / 100);
    } catch (error) {
      console.error('Error calculating total discount:', error);
      return sum;
    }
  }, 0);

  const ppn = (subtotal - totalDiscount) * 0.11;
  const totalHargaSO = subtotal - totalDiscount + ppn;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-subtitle">TRANSAKSI</div>
        <h1 className="page-title">Sales Order (SO)</h1>
      </div>

      {/* Main Content Card */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Input Sales Order Baru</CardTitle>
            <div className="flex space-sm">
              <Button variant="destructive" size="sm" onClick={handleFillTestData} className="btn-danger">
                Fill Test Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddTestItem} className="btn-outline">
                Add Test Item
              </Button>
              <Button variant="default" size="sm" onClick={handleTestSimpanSO} className="btn-primary">
                Test Simpan SO
              </Button>

              <Button variant="secondary" size="sm" onClick={handleBackToList} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke List
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="section-content space-md">
          {/* Customer Information */}
          <CustomerInfoTabs 
            onCustomerSelect={handleCustomerSelect}
            selectedCustomer={selectedCustomer}
          />

                     {/* Display Selected Customer Info */}
           {selectedCustomer && (
             <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
               <div className="text-sm font-medium text-gray-800 mb-2">
                 Data Pelanggan yang Dipilih:
               </div>
               <div className="grid grid-cols-2 gap-4 text-sm">
                 <div><strong>Nama:</strong> {selectedCustomer.nama}</div>
                 <div><strong>Kode:</strong> {selectedCustomer.kode}</div>
                 <div><strong>Telepon:</strong> {selectedCustomer.telepon}</div>
                 <div><strong>Email:</strong> {selectedCustomer.email}</div>
                 <div className="col-span-2"><strong>Alamat:</strong> {selectedCustomer.alamat}</div>
               </div>
             </div>
           )}

          <div className="border-t pt-6">
            {/* Sales Order Details */}
            <div className="grid-form m-lg">
              <div>
                <Label htmlFor="soNumber">Nomor SO</Label>
                <Input
                  id="soNumber"
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="soDate">Tanggal SO</Label>
                <div className="relative">
                  <Input
                    id="soDate"
                    type="date"
                    value={soDate}
                    onChange={(e) => setSoDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <Label htmlFor="deliveryDate">Tanggal Pengiriman</Label>
                <div className="relative">
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
                             <div>
                 <SearchSelect
                   label="Term of Payment"
                   placeholder="Pilih Term of Payment"
                   searchPlaceholder="Cari term of payment..."
                   value={termOfPayment}
                   onValueChange={setTermOfPayment}
                   options={termOptions}
                   loading={loadingTerm}
                   required
                 />
               </div>
               <div>
                 <SearchSelect
                   label="Asal Gudang"
                   placeholder="Pilih Gudang"
                   searchPlaceholder="Cari gudang..."
                   value={originWarehouse}
                   onValueChange={setOriginWarehouse}
                   options={warehouseOptions}
                   loading={loadingWarehouse}
                   required
                 />
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Item Input Form */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <CardTitle className="page-title">Input Item</CardTitle>
        </CardHeader>
        <CardContent className="section-content">
          <div className="grid-form m-lg">
            {/* Dimensi Input - Dynamic based on selected shape */}
            {selectedShape?.dimensi === "1D" ? (
              <div>
                <Label htmlFor="itemDiameter">Diameter/Panjang (m)</Label>
                <Input
                  id="itemDiameter"
                  type="number"
                  step="0.01"
                  value={itemDiameter || itemLength}
                  onChange={(e) => {
                    if (selectedShape.nama === "AS") {
                      setItemDiameter(e.target.value);
                    } else {
                      setItemLength(e.target.value);
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            ) : selectedShape?.dimensi === "2D" ? (
              <>
                <div>
                  <Label htmlFor="itemLength">Panjang (m)</Label>
                  <Input
                    id="itemLength"
                    type="number"
                    step="0.01"
                    value={itemLength}
                    onChange={(e) => setItemLength(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="itemWidth">Lebar (m)</Label>
                  <Input
                    id="itemWidth"
                    type="number"
                    step="0.01"
                    value={itemWidth}
                    onChange={(e) => setItemWidth(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <Label className="text-gray-500">Pilih bentuk barang terlebih dahulu</Label>
              </div>
            )}
            <div>
              <Label htmlFor="itemQty">Qty</Label>
              <Input
                id="itemQty"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                min="1"
              />
            </div>
                         <div>
               <SearchSelect
                 label="Jenis Barang"
                 placeholder="Pilih Jenis Barang"
                 searchPlaceholder="Cari jenis barang..."
                 value={itemType}
                 onValueChange={setItemType}
                 options={itemTypeOptions}
                 loading={loadingItemType}
                 required
               />
             </div>
            <div>
              <Label htmlFor="itemShape">Bentuk Barang</Label>
              <div className="flex gap-2">
                <Input
                  value={selectedShape ? `${selectedShape.nama} (${selectedShape.dimensi})` : ""}
                  placeholder="Pilih Bentuk Barang"
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShapeModalOpen(true)}
                >
                  Pilih
                </Button>
              </div>
            </div>
                         <div>
               <SearchSelect
                 label="Grade Barang"
                 placeholder="Pilih Grade"
                 searchPlaceholder="Cari grade..."
                 value={itemGrade}
                 onValueChange={setItemGrade}
                 options={itemGradeOptions}
                 loading={loadingItemGrade}
                 required
               />
             </div>
            <div>
              <Label htmlFor="itemPrice">Harga</Label>
              <Input
                id="itemPrice"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="Auto dari jenis plat"
              />
            </div>
                         <div>
               <SearchSelect
                 label="Satuan"
                 placeholder="Pilih Satuan"
                 searchPlaceholder="Cari satuan..."
                 value={itemUnit}
                 onValueChange={setItemUnit}
                 options={unitOptions}
                 loading={loadingUnit}
                 required
               />
             </div>
            <div>
              <Label htmlFor="itemDiscount">Diskon (%)</Label>
              <Input
                id="itemDiscount"
                type="number"
                value={itemDiscount}
                onChange={(e) => setItemDiscount(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="itemNotes">Catatan</Label>
              <Input
                id="itemNotes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Calculated Values */}
          <div className="grid-summary m-lg p-md bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">Ketebalan</Label>
              <div className="font-medium">{itemThickness}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">
                {itemShape === "lingkaran" ? "Luas Lingkaran" : "Luas Persegi"}
              </Label>
              <div className="font-medium">{itemArea}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Harga/m²</Label>
              <div className="font-medium">{itemPricePerUnit}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Item</Label>
              <div className="font-medium">{itemTotal}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAddItem} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Item List Table */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Daftar Item dalam SO</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddTestItem} className="btn-outline">
              <Dices className="w-4 h-4 mr-2" />
              Fill Test Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="section-content">
          <Table className="table-standard">
            <TableHeader className="table-header-standard">
              <TableRow>
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
                <TableHead className="table-header-cell-standard">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="table-cell-standard">{index + 1}</TableCell>
                  <TableCell className="table-cell-standard">{item.jenisBarang}</TableCell>
                  <TableCell className="table-cell-standard">{item.bentuk}</TableCell>
                  <TableCell className="table-cell-standard">{item.grade}</TableCell>
                  <TableCell className="table-cell-standard">{item.dimensi}</TableCell>
                  <TableCell className="table-cell-standard">{item.qty}</TableCell>
                  <TableCell className="table-cell-standard">{item.luasPerItem}</TableCell>
                  <TableCell className="table-cell-standard">{item.harga}</TableCell>
                  <TableCell className="table-cell-standard">{item.satuan}</TableCell>
                  <TableCell className="table-cell-standard">{item.diskon}</TableCell>
                  <TableCell className="table-cell-standard">{item.total}</TableCell>
                  <TableCell className="table-cell-standard">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="table-cell-standard text-center text-gray-500 py-8">
                    Belum ada item yang ditambahkan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="mb-6 bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Subtotal</Label>
              <div className="text-lg font-semibold">{formatCurrency(subtotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Diskon</Label>
              <div className="text-lg font-semibold">{formatCurrency(totalDiscount)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">PPN (11%)</Label>
              <div className="text-lg font-semibold">{formatCurrency(ppn)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Harga SO</Label>
              <div className="text-xl font-bold text-green-700">{formatCurrency(totalHargaSO)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button size="lg" className="bg-green-600 hover:bg-green-700">
          Simpan SO
        </Button>
                 <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
           Print SO
         </Button>
       </div>

       {/* Data Table Modal for Shape Selection */}
       <DataTableModal
         open={shapeModalOpen}
         onOpenChange={setShapeModalOpen}
         onItemSelect={handleShapeSelect}
         data={itemShapeOptions}
         columns={shapeColumns}
         title="Pilih Bentuk Barang"
         searchPlaceholder="Cari bentuk barang..."
         selectButtonText="Pilih"
       />

       {/* Alert Modal Component */}
       <AlertComponent />
     </div>
   );
 }
