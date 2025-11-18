import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import CustomerInfoTabs from "@/components/CustomerInfoTabs"; // Commented out - akan diganti dengan supplier selection
import DataTableModal from "@/components/modals/DataTableModal";
import SearchSelect from "@/components/ui/search-select";
import { 
  getSupplierOptions,
  getJenisBarangOptions, 
  getBentukBarangOptions, 
  getGradeBarangOptions, 
  getUnitOptions 
} from "@/services/masterDataService";
import { useAlert } from "@/hooks/useAlert";
import { useRole } from "@/hooks/useRole";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import SalesOrderLayout from "@/components/SalesOrderLayout";

export default function AddPurchaseOrderPage() {
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();
  
  // Master data state
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  // Loading states
  const [loadingSupplier, setLoadingSupplier] = useState(false);
  const [loadingItemType, setLoadingItemType] = useState(false);
  const [loadingItemShape, setLoadingItemShape] = useState(false);
  const [loadingItemGrade, setLoadingItemGrade] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);

  // Supplier Information
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");

  // Load master data on component mount
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingSupplier(true);
        setLoadingItemType(true);
        setLoadingItemShape(true);
        setLoadingItemGrade(true);
        setLoadingUnit(true);

        const [
          suppliers,
          jenisBarang,
          bentukBarang,
          gradeBarang,
          units
        ] = await Promise.all([
          getSupplierOptions(),
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getUnitOptions()
        ]);

        setSupplierOptions(suppliers);
        setItemTypeOptions(jenisBarang);
        setItemShapeOptions(bentukBarang);
        setItemGradeOptions(gradeBarang);
        setUnitOptions(units);
      } catch (error) {
        console.error('Error loading master data:', error);
      } finally {
        setLoadingSupplier(false);
        setLoadingItemType(false);
        setLoadingItemShape(false);
        setLoadingItemGrade(false);
        setLoadingUnit(false);
      }
    };

    loadMasterData();
  }, []);

  // Purchase Order Details
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalPenerimaan, setTanggalPenerimaan] = useState("");
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [tanggalPembayaran, setTanggalPembayaran] = useState("");
  const [status, setStatus] = useState("draft");
  const [catatan, setCatatan] = useState("");

  // Item Input Form
  const [itemLength, setItemLength] = useState("");
  const [itemWidth, setItemWidth] = useState("");
  const [itemDiameter, setItemDiameter] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemType, setItemType] = useState("");
  const [itemShape, setItemShape] = useState("");
  const [selectedShape, setSelectedShape] = useState(null);
  const [itemGrade, setItemGrade] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemUnit, setItemUnit] = useState("per-dimensi");
  const [itemDiscount, setItemDiscount] = useState("0");
  const [itemNotes, setItemNotes] = useState("");
  const [itemWeight, setItemWeight] = useState("");

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
    const timeoutId = setTimeout(() => {
      try {
        const length = parseFloat(itemLength) || 0;
        const width = parseFloat(itemWidth) || 0;
        const thickness = parseFloat(itemDiameter) || 0;
        const qty = parseInt(itemQty) || 0;
        const discount = parseFloat(itemDiscount) || 0;
        const pricePerUnit = parseFloat(itemPrice) || 0;

        // Hitung ketebalan (dalam mm)
        let thicknessDisplay = "- mm";
        if (thickness > 0) {
          thicknessDisplay = `${thickness} mm`;
        }
        setItemThickness(thicknessDisplay);

        // Hitung luas persegi berdasarkan dimensi (TEBAL TIDAK DIHITUNG)
        // Input dalam mm, perlu konversi ke m/m²
        let area = 0;
        let areaPerItem = "0.00";

        if (selectedShape?.dimensi === "1D") {
          // Untuk bentuk 1D (shaft), luas = panjang saja (tanpa tebal)
          // Convert mm to m
          area = length;
          areaPerItem = (area / 1000).toFixed(2); // Convert mm to m
        } else if (selectedShape?.dimensi === "2D") {
          // Untuk bentuk 2D (plat), luas = panjang x lebar (tanpa tebal)
          // Convert mm² to m²
          area = length * width;
          areaPerItem = (area / 10000).toFixed(2); // Convert mm² to m²
        }

        // Hitung harga per m²
        let pricePerM2 = "Rp 0/m²";
        if (pricePerUnit > 0) {
          pricePerM2 = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m²`;
        }
        setItemPricePerUnit(pricePerM2);

        // Hitung total item (termasuk diskon)
        // Menggunakan area dalam m/m² untuk perhitungan
        let totalBeforeDiscount = 0;
        let totalAfterDiscount = 0;
        
        if (pricePerUnit > 0) {
          let areaInM = 0;
          if (selectedShape?.dimensi === "1D") {
            // 1D: panjang dalam m
            areaInM = length / 1000;
            totalBeforeDiscount = areaInM * pricePerUnit * qty;
          } else if (selectedShape?.dimensi === "2D") {
            // 2D: luas dalam m²
            areaInM = (length * width) / 10000;
            totalBeforeDiscount = areaInM * pricePerUnit * qty;
          }
          
          const discountAmount = totalBeforeDiscount * (discount / 100);
          totalAfterDiscount = totalBeforeDiscount - discountAmount;
        }

        // Set area display based on shape
        if (selectedShape?.dimensi === "1D") {
          setItemArea(`${areaPerItem} m`); // 1D shows in meters
        } else {
          setItemArea(`${areaPerItem} m²`); // 2D shows in square meters
        }
        setItemTotal(`Rp ${totalAfterDiscount.toLocaleString('id-ID')}`);

      } catch (error) {
        console.error('Error calculating area:', error);
        setItemThickness("- mm");
        setItemArea("0.00 m²");
        setItemPricePerUnit("Rp 0/m²");
        setItemTotal("Rp 0");
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [itemLength, itemWidth, itemDiameter, selectedShape, itemQty, itemDiscount, itemPrice]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSupplierSelect = (supplier) => {
    if (!supplier) return;
    
    setSelectedSupplier(supplier);
    setSupplierName(supplier.nama || "");
    setSupplierPhone(supplier.telepon || "");
    setSupplierEmail(supplier.email || "");
    setSupplierAddress(supplier.alamat || "");
  };

  const handleAddItem = () => {
    try {
      // Validasi field wajib
      if (!itemType || !selectedShape || !itemGrade || !itemPrice || !itemQty || !itemLength) {
        showAlert("Peringatan", "Mohon lengkapi data item yang wajib (*)", "warning");
        return;
      }

      // Validasi berdasarkan dimensi bentuk barang
      if (selectedShape.dimensi === "1D") {
        if (!itemLength || !itemWidth) {
          showAlert("Peringatan", "Mohon isi panjang dan lebar untuk bentuk 1D", "warning");
          return;
        }
      } else if (selectedShape.dimensi === "2D") {
        if (!itemLength || !itemDiameter) {
          showAlert("Peringatan", "Mohon isi panjang dan tebal untuk bentuk 2D", "warning");
          return;
        }
      }

      // Validasi nilai numerik
      if (parseFloat(itemPrice) <= 0) {
        showAlert("Peringatan", "Harga harus lebih besar dari 0", "warning");
        return;
      }

      if (parseInt(itemQty) <= 0) {
        showAlert("Peringatan", "Qty harus lebih besar dari 0", "warning");
        return;
      }

      let dimensiString = "";
      if (selectedShape.dimensi === "1D") {
        // 1D: panjang x tebal
        dimensiString = `${itemLength} x ${itemDiameter}`;
      } else {
        // 2D: panjang x lebar x tebal
        dimensiString = `${itemLength} x ${itemWidth} x ${itemDiameter}`;
      }

      // Calculate subtotal untuk backend
      // Input dalam mm, perlu konversi ke m/m² untuk perhitungan
      const length = parseFloat(itemLength) || 0;
      const width = parseFloat(itemWidth) || 0;
      const qty = parseInt(itemQty);
      const hargaSatuan = parseFloat(itemPrice) || 0;
      
      let areaInM = 0;
      let subtotalBeforeDiscount = 0;
      
      if (selectedShape?.dimensi === "1D") {
        // 1D: panjang dalam m
        areaInM = length / 1000;
        subtotalBeforeDiscount = areaInM * hargaSatuan * qty;
      } else if (selectedShape?.dimensi === "2D") {
        // 2D: luas dalam m²
        areaInM = (length * width) / 10000;
        subtotalBeforeDiscount = areaInM * hargaSatuan * qty;
      }
      
      const discountAmount = subtotalBeforeDiscount * (parseFloat(itemDiscount) || 0) / 100;
      const subtotal = subtotalBeforeDiscount - discountAmount;

      const newItem = {
        id: Date.now(),
        // Display fields untuk table
        jenisBarang: itemTypeOptions.find(opt => opt.value === itemType)?.label || itemType,
        bentuk: selectedShape.nama,
        grade: itemGradeOptions.find(opt => opt.value === itemGrade)?.label || itemGrade,
        dimensi: dimensiString,
        qty: qty,
        luasPerItem: itemArea,
        hargaDisplay: itemPricePerUnit,
        satuanDisplay: unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit,
        diskonDisplay: `${itemDiscount}%`,
        total: itemTotal,
        // Backend fields - sesuai dengan validasi backend
        jenis_barang_id: itemType, // ID jenis barang
        bentuk_barang_id: selectedShape.id, // ID bentuk barang
        grade_barang_id: itemGrade, // ID grade barang
        panjang: length,
        lebar: width,
        tebal: parseFloat(itemDiameter) || 0,
        harga: hargaSatuan, // harga per satuan
        satuan: itemUnit, // satuan
        diskon: parseFloat(itemDiscount) || 0, // persentase diskon (backend value)
        catatan: itemNotes || null
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

  const handleTestSimpanPO = async () => {
    console.log("Testing save PO...");
    
    if (!selectedSupplier) {
      showAlert("Peringatan", "Supplier harus dipilih", "warning");
      return;
    }
    
    if (items.length === 0) {
      showAlert("Peringatan", "Minimal harus ada 1 item", "warning");
      return;
    }
    
    try {
      // Calculate total amount dari semua items
      // Konversi mm ke m/m² untuk perhitungan
      const totalAmount = items.reduce((sum, item) => {
        const length = item.panjang || 0;
        const width = item.lebar || 0;
        const qty = item.qty || 0;
        const harga = item.harga || 0;
        const diskon = item.diskon || 0;
        
        // Konversi mm ke m/m²
        let areaInM = 0;
        if (width > 0) {
          // 2D: luas dalam m²
          areaInM = (length * width) / 10000;
        } else {
          // 1D: panjang dalam m
          areaInM = length / 1000;
        }
        
        const subtotalBeforeDiscount = areaInM * harga * qty;
        const discountAmount = subtotalBeforeDiscount * (diskon / 100);
        const subtotal = subtotalBeforeDiscount - discountAmount;
        
        return sum + subtotal;
      }, 0);
      
      const purchaseOrderData = {
        nomor_po: poNumber,
        tanggal_po: poDate,
        tanggal_penerimaan: tanggalPenerimaan,
        tanggal_jatuh_tempo: tanggalJatuhTempo,
        tanggal_pembayaran: tanggalPembayaran,
        id_supplier: selectedSupplier.id,
        total_amount: totalAmount,
        status: status,
        catatan: catatan || null,
        items: items.map(item => ({
          qty: item.qty,
          panjang: item.panjang,
          lebar: item.lebar,
          tebal: item.tebal,
          jenis_barang_id: item.jenis_barang_id,
          bentuk_barang_id: item.bentuk_barang_id,
          grade_barang_id: item.grade_barang_id,
          harga: item.harga,
          satuan: item.satuan,
          diskon: item.diskon,
          catatan: item.catatan
        }))
      };
      
      console.log("Data yang akan dikirim ke API:", purchaseOrderData);
      
      const result = await request(API_ENDPOINTS.purchaseOrder, {
        method: 'POST',
        body: JSON.stringify(purchaseOrderData)
      });
      
      console.log("✅ Purchase Order berhasil disimpan:", result);
      showAlert("Sukses", "Purchase Order berhasil disimpan!", "success");
      
      setTimeout(() => {
        window.history.back();
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error saving Purchase Order:", error);
      showAlert("Error", "Terjadi kesalahan saat menyimpan Purchase Order", "error");
    }
  };

  const handleBackToList = () => {
    window.history.back();
  };

  const handleAutoFill = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-3);
    setPoNumber(`PO-${year}${month}${day}-${timestamp}`);
    
    setSupplierName("PT Supplier Baja Sejahtera");
    setSupplierPhone("08123456789");
    setSupplierEmail("info@supplier-baja.com");
    setSupplierAddress("Jl. Industri Baja No. 456, Bekasi");
    
    if (supplierOptions.length > 0) {
      const firstSupplier = supplierOptions[0];
      setSelectedSupplier(firstSupplier);
    } else {
      setSelectedSupplier({
        id: 1,
        nama: "PT Supplier Baja Sejahtera",
        kode: "SUPP-001",
        telepon: "08123456789",
        email: "info@supplier-baja.com",
        alamat: "Jl. Industri Baja No. 456, Bekasi"
      });
    }

    // Set default status dan catatan
    setStatus("draft");
    setCatatan("Auto-filled Purchase Order untuk testing");

    const autoItems = [
      {
        id: Date.now(),
        jenisBarang: itemTypeOptions.length > 0 ? itemTypeOptions[0].label : "Plat Besi",
        bentuk: "Persegi",
        grade: itemGradeOptions.length > 0 ? itemGradeOptions[0].label : "Grade A",
        dimensi: "2.50 x 1.20",
        qty: 3,
        luasPerItem: "3.00 m²",
        hargaDisplay: "Rp 75,000/m²",
        satuanDisplay: unitOptions.length > 0 ? unitOptions[0].label : "Per Dimensi",
        diskonDisplay: "5%",
        total: "Rp 213,750",
        // Backend fields - sesuai dengan validasi backend
        jenis_barang_id: itemTypeOptions.length > 0 ? itemTypeOptions[0].value : 1,
        bentuk_barang_id: 1, // ID bentuk barang persegi
        grade_barang_id: itemGradeOptions.length > 0 ? itemGradeOptions[0].value : 1,
        panjang: 2.50,
        lebar: 1.20,
        tebal: 0.50,
        harga: 75000,
        satuan: "per-dimensi",
        diskon: 5, // Backend value
        catatan: "Auto-filled item 1 😄"
      },
      {
        id: Date.now() + 1,
        jenisBarang: itemTypeOptions.length > 1 ? itemTypeOptions[1].label : "Besi Beton",
        bentuk: "Bulat",
        grade: itemGradeOptions.length > 1 ? itemGradeOptions[1].label : "Grade B",
        dimensi: "6.00 x 0.12",
        qty: 2,
        luasPerItem: "0.72 m²",
        hargaDisplay: "Rp 45,000/m²",
        satuanDisplay: unitOptions.length > 0 ? unitOptions[0].label : "Per Dimensi",
        diskonDisplay: "3%",
        total: "Rp 62,856",
        // Backend fields - sesuai dengan validasi backend
        jenis_barang_id: itemTypeOptions.length > 1 ? itemTypeOptions[1].value : 2,
        bentuk_barang_id: 2, // ID bentuk barang bulat
        grade_barang_id: itemGradeOptions.length > 1 ? itemGradeOptions[1].value : 2,
        panjang: 6.00,
        lebar: 0.12,
        tebal: 0.12,
        harga: 45000,
        satuan: "per-dimensi",
        diskon: 3, // Backend value
        catatan: "Auto-filled item 2 🎯"
      }
    ];

    setItems(autoItems);
    showAlert("Info", "Data sudah di-auto fill! Items langsung masuk ke table. 🎲", "info");
  };

  const handleShapeSelect = (shape) => {
    setSelectedShape(shape);
    
    // Reset field lebar saat bentuk barang berubah
    if (shape?.dimensi === "1D") {
      setItemWidth("");
    }
  };

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
  // Perlu mendapatkan dimensi shape untuk setiap item, tapi karena tidak disimpan di item,
  // kita asumsikan semua item 2D (karena purchase order biasanya untuk plat)
  // Atau kita bisa hitung berdasarkan apakah lebar > 0
  const subtotal = items.reduce((sum, item) => {
    try {
      const length = item.panjang || 0;
      const width = item.lebar || 0;
      const qty = item.qty || 0;
      const harga = item.harga || 0;
      const diskon = item.diskon || 0;
      
      // Konversi mm ke m/m²
      let areaInM = 0;
      if (width > 0) {
        // 2D: luas dalam m²
        areaInM = (length * width) / 10000;
      } else {
        // 1D: panjang dalam m
        areaInM = length / 1000;
      }
      
      const subtotalBeforeDiscount = areaInM * harga * qty;
      const discountAmount = subtotalBeforeDiscount * (diskon / 100);
      const subtotal = subtotalBeforeDiscount - discountAmount;
      
      return sum + subtotal;
    } catch (error) {
      console.error('Error calculating subtotal:', error);
      return sum;
    }
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    try {
      const length = item.panjang || 0;
      const width = item.lebar || 0;
      const qty = item.qty || 0;
      const harga = item.harga || 0;
      const diskon = item.diskon || 0;
      
      // Konversi mm ke m/m²
      let areaInM = 0;
      if (width > 0) {
        // 2D: luas dalam m²
        areaInM = (length * width) / 10000;
      } else {
        // 1D: panjang dalam m
        areaInM = length / 1000;
      }
      
      const subtotalBeforeDiscount = areaInM * harga * qty;
      const discountAmount = subtotalBeforeDiscount * (diskon / 100);
      
      return sum + discountAmount;
    } catch (error) {
      console.error('Error calculating total discount:', error);
      return sum;
    }
  }, 0);

  const ppn = subtotal * 0.11;
  const totalHargaSO = subtotal + ppn;

  return (
    <SalesOrderLayout title="Purchase Order (PO)" subtitle="TRANSAKSI">
      {/* Main Content Card */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Input Purchase Order Baru</CardTitle>
            <div className="flex space-sm">
              {/* {isUserAdmin && (
                <Button variant="outline" size="sm" onClick={handleAutoFill} className="btn-outline">
                  🎲 Auto Fill (Testing Purposes)
                </Button>
              )} */}
              
              <Button variant="default" size="sm" onClick={handleTestSimpanPO} className="btn-primary">
                Simpan Purchase Order
              </Button>

              <Button variant="secondary" size="sm" onClick={handleBackToList} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke List
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="section-content space-md">
          {/* Supplier Information */}
          <div className="grid-form m-lg">
            <div className="col-span-2">
              <SearchSelect
                label="Supplier"
                placeholder="Pilih Supplier"
                searchPlaceholder="Cari supplier..."
                value={selectedSupplier?.id || ""}
                onValueChange={(value) => {
                  const supplier = supplierOptions.find(opt => opt.value == value);
                  if (supplier) {
                    handleSupplierSelect(supplier);
                  }
                }}
                options={supplierOptions}
                loading={loadingSupplier}
                required
              />
            </div>
          </div>

          {/* Display Selected Supplier Info */}
          {selectedSupplier && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="text-sm font-medium text-gray-800 mb-2">
                Data Supplier yang Dipilih:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nama:</strong> {selectedSupplier.nama}</div>
                <div><strong>Kode:</strong> {selectedSupplier.kode}</div>
                <div><strong>Telepon:</strong> {selectedSupplier.telepon}</div>
                <div><strong>Email:</strong> {selectedSupplier.email}</div>
                <div className="col-span-2"><strong>Alamat:</strong> {selectedSupplier.alamat}</div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            {/* Purchase Order Details */}
            <div className="grid-form m-lg">
              <div>
                <Label htmlFor="poNumber">Nomor PO *</Label>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Nomor PO akan otomatis terisi di database"
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="poDate">Tanggal PO *</Label>
                <div className="relative">
                  <Input
                    id="poDate"
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    disabled
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="tanggalPenerimaan">Tanggal Penerimaan</Label>
                <div className="relative">
                  <Input
                    id="tanggalPenerimaan"
                    type="date"
                    value={tanggalPenerimaan}
                    onChange={(e) => setTanggalPenerimaan(e.target.value)}
                    disabled
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="tanggalJatuhTempo">Tanggal Jatuh Tempo *</Label>
                <div className="relative">
                  <Input
                    id="tanggalJatuhTempo"
                    type="date"
                    value={tanggalJatuhTempo}
                    onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                    required
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="tanggalPembayaran">Tanggal Pembayaran</Label>
                <div className="relative">
                  <Input
                    id="tanggalPembayaran"
                    type="date"
                    value={tanggalPembayaran}
                    onChange={(e) => setTanggalPembayaran(e.target.value)}
                    disabled
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <SearchSelect
                  placeholder="Pilih Status"
                  searchPlaceholder="Cari status..."
                  value={status}
                  onValueChange={setStatus}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'received', label: 'Received' },
                    { value: 'paid', label: 'Paid' },
                  ]}
                  disabled
                />
              </div>
            </div>
            
            {/* Catatan */}
            <div className="mt-6">
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Masukkan catatan untuk Purchase Order (maksimal 500 karakter)..."
                maxLength="500"
                className="min-h-[100px] resize-y"
              />
              <div className="text-sm text-gray-500 mt-1">
                {catatan.length}/500 karakter
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
            {/* Row 1: Bentuk Barang, Qty, Jenis Barang */}
            <div>
              <Label htmlFor="itemShape">Bentuk Barang</Label>
              <div className="flex gap-2">
                <Input
                  value={selectedShape ? `${selectedShape.nama} (${selectedShape.dimensi})` : ""}
                  placeholder="Pilih Bentuk Barang"
                  readOnly
                  className="flex-1"
                  required
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
              <Label htmlFor="itemQty">Qty</Label>
              <Input
                id="itemQty"
                type="number"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                min="1"
                required
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

            {/* Row 2: Grade Barang, Satuan, Timbangan */}
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
              <Label htmlFor="itemWeight">Timbangan (kg)</Label>
              <Input
                id="itemWeight"
                type="number"
                step="0.01"
                value={itemWeight}
                onChange={(e) => setItemWeight(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Row 3: Panjang, Lebar, Tebal */}
            <div>
              <Label htmlFor="itemLength">Panjang (mm)</Label>
              <Input
                id="itemLength"
                type="number"
                step="0.01"
                value={itemLength}
                onChange={(e) => setItemLength(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="itemWidth">Lebar (mm)</Label>
              <Input
                id="itemWidth"
                type="number"
                step="0.01"
                value={itemWidth}
                onChange={(e) => setItemWidth(e.target.value)}
                placeholder="0.00"
                disabled={selectedShape?.dimensi === "1D"}
                required={selectedShape?.dimensi === "2D"}
              />
            </div>
            <div>
              <Label htmlFor="itemDiameter">Tebal (mm) {selectedShape?.dimensi === "2D" ? "*" : ""}</Label>
              <Input
                id="itemDiameter"
                type="number"
                step="0.01"
                value={itemDiameter}
                onChange={(e) => setItemDiameter(e.target.value)}
                placeholder="0.00"
                required={selectedShape?.dimensi === "2D"}
              />
            </div>

            {/* Row 4: Harga, Diskon, Empty */}
            <div>
              <Label htmlFor="itemPrice">Harga (Rp/m²)</Label>
              <Input
                id="itemPrice"
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="0"
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
                placeholder="0"
              />
            </div>
            <div></div> {/* Empty cell untuk melengkapi 3 kolom */}
          </div>

          {/* Calculated Values */}
          <div className="grid-summary m-lg p-md bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">Ketebalan</Label>
              <div className="font-medium text-blue-600">{itemThickness}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Ukuran Panjang/Luas</Label>
              <div className="font-medium text-green-600">{itemArea}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Harga/m²</Label>
              <div className="font-medium text-orange-600">{itemPricePerUnit}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Total Item</Label>
              <div className="font-medium text-red-600">{itemTotal}</div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <Label htmlFor="itemNotes">Catatan (Opsional)</Label>
            <Textarea
              id="itemNotes"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Masukkan catatan tambahan untuk item ini (opsional)..."
              className="min-h-[100px] resize-y"
            />
          </div>

          <div className="flex justify-end mt-6">
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
            <CardTitle className="page-title">Daftar Item dalam PO</CardTitle>
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
                  <TableCell className="table-cell-standard">{item.hargaDisplay}</TableCell>
                  <TableCell className="table-cell-standard">{item.satuanDisplay}</TableCell>
                  <TableCell className="table-cell-standard">{item.diskonDisplay}</TableCell>
                  <TableCell className="table-cell-standard">{item.total}</TableCell>
                  <TableCell className="table-cell-standard">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn-danger"
                    >
                      <Plus className="w-4 h-4" />
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
              <Label className="text-sm text-gray-600">Total Harga PO</Label>
              <div className="text-xl font-bold text-green-700">{formatCurrency(subtotal)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Action Buttons */}
       <div className="flex justify-center gap-4">
         <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleTestSimpanPO}>
           Simpan PO
         </Button>
         {hasRole(['admin', 'manager', 'supervisor']) && (
           <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
             Print PO
           </Button>
         )}
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
    </SalesOrderLayout>
  );
}
