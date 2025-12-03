import React, { useState, useEffect } from "react";
import { Plus, ArrowLeft, Calendar, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRole } from "@/hooks/useRole";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import SalesOrderLayout from "@/components/SalesOrderLayout";
import { documentSequenceService } from "@/services/master-data/documentSequenceService";
import { generateSalesOrderPrintContent, openPrintDialog } from "@/lib/printUtils";

export default function AddSalesOrderPage() {
  const { showAlert, AlertComponent } = useAlert();
  const { isUserAdmin, hasRole } = useRole();
  
  // Master data state
  const [termOptions, setTermOptions] = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [itemTypeOptions, setItemTypeOptions] = useState([]);
  const [itemShapeOptions, setItemShapeOptions] = useState([]);
  const [itemGradeOptions, setItemGradeOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);

  // Handover method options
  const handoverMethodOptions = [
    { value: "pickup", label: "Pickup" },
    { value: "delivery", label: "Delivery" }
  ];

  // Loading states
  const [loadingTerm, setLoadingTerm] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [loadingItemType, setLoadingItemType] = useState(false);
  const [loadingItemShape, setLoadingItemShape] = useState(false);
  const [loadingItemGrade, setLoadingItemGrade] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

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
          units,
          soNumber
        ] = await Promise.all([
          getTermOptions(),
          getGudangOptions(),
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getUnitOptions(),
          documentSequenceService.generateSONumber()
        ]);

        setTermOptions(terms);
        setWarehouseOptions(gudang);
        setItemTypeOptions(jenisBarang);
        setItemShapeOptions(bentukBarang);
        setItemGradeOptions(gradeBarang);
        setUnitOptions(units);
        
        // Set generated SO number
        setSoNumber(soNumber);
        console.log('Generated SO number:', soNumber);
      } catch (error) {
        console.error('Error loading master data:', error);
        showAlert('Error', 'Gagal memuat data master atau generate nomor SO', 'error');
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
  const [soNumber, setSoNumber] = useState("");
  const [soDate, setSoDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [termOfPayment, setTermOfPayment] = useState("cash");
  const [originWarehouse, setOriginWarehouse] = useState("");
  const [handoverMethod, setHandoverMethod] = useState("pickup");

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
  const [itemCutType, setItemCutType] = useState("potongan");
  const cutTypeOptions = [
    { value: "potongan", label: "Potongan" },
    { value: "utuh", label: "Utuh" }
  ];

  // Modal state
  const [shapeModalOpen, setShapeModalOpen] = useState(false);

  // Calculated values
  const [itemThickness, setItemThickness] = useState("- mm");
  const [itemArea, setItemArea] = useState("0.00 m²");
  const [itemPricePerUnit, setItemPricePerUnit] = useState("Rp 0/m²");
  const [itemTotal, setItemTotal] = useState("Rp 0");

  // Item List
  const [items, setItems] = useState([]);

  // Function to calculate price based on satuan
  const calculatePriceBySatuan = (satuan, panjang, lebar, tebal, qty, pricePerUnit, berat = 0, selectedShape = null) => {
    const panjangM = panjang / 1000; // Convert mm to m
    const lebarM = lebar / 1000; // Convert mm to m
    const tebalM = tebal / 1000; // Convert mm to m
    
    switch (satuan?.toLowerCase()) {
      case 'utuh':
      case 'per unit':
      case 'per pcs':
        // Harga X quantity
        return pricePerUnit * qty;
        
      case 'kilogram':
      case 'kg':
        // Harga X kg (berat)
        if (berat <= 0) {
          // Jika berat tidak ada, estimasi berdasarkan volume dan densitas besi (7.85 g/cm³)
          const volumeCm3 = (panjang * lebar * tebal) / 1000; // mm³ to cm³
          const estimatedWeight = volumeCm3 * 7.85 / 1000; // Convert to kg
          return pricePerUnit * estimatedWeight;
        }
        return pricePerUnit * berat;
        
      case 'dimensi':
      case 'per dimensi':
      case 'per m²':
      case 'm²':
        // Harga X panjang X lebar (atau panjang saja untuk 1D) - TEBAL TIDAK DIHITUNG
        if (selectedShape?.dimensi === "1D") {
          // Untuk 1D (shaft): harga X panjang saja
          return pricePerUnit * panjangM;
        } else {
          // Untuk 2D (plat): harga X panjang X lebar saja (tanpa tebal)
          return pricePerUnit * panjangM * lebarM;
        }
        
      case 'per m³':
      case 'm³':
        // Harga X volume
        const volumeM3 = panjangM * lebarM * tebalM;
        return pricePerUnit * volumeM3;
        
      default:
        // Default: harga X quantity
        return pricePerUnit * qty;
    }
  };

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
        let area = 0;
        let areaPerItem = "0.00";

        if (selectedShape?.dimensi === "1D") {
          // Untuk bentuk 1D (shaft), luas = panjang saja (tanpa tebal)
          area = length;
          areaPerItem = (area / 1000).toFixed(2); // Convert mm to m
        } else if (selectedShape?.dimensi === "2D") {
          // Untuk bentuk 2D (plat), luas = panjang x lebar (tanpa tebal)
          area = length * width;
          areaPerItem = (area / 10000).toFixed(2); // Convert mm² to m²
        }

        // Get current satuan
        const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;
        
        // Hitung harga berdasarkan satuan
        let priceDisplay = "Rp 0";
        if (pricePerUnit > 0) {
          switch (currentSatuan?.toLowerCase()) {
            case 'utuh':
            case 'per unit':
            case 'per pcs':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/unit`;
              break;
            case 'kilogram':
            case 'kg':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/kg`;
              break;
            case 'dimensi':
            case 'per dimensi':
            case 'per m²':
            case 'm²':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m²`;
              break;
            case 'per m³':
            case 'm³':
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/m³`;
              break;
            default:
              priceDisplay = `Rp ${pricePerUnit.toLocaleString('id-ID')}/unit`;
          }
        }
        setItemPricePerUnit(priceDisplay);

        // Hitung total item berdasarkan satuan (termasuk diskon)
        let totalBeforeDiscount = 0;
        let totalAfterDiscount = 0;
        
        if (pricePerUnit > 0) {
          const unitPrice = calculatePriceBySatuan(currentSatuan, length, width, thickness, qty, pricePerUnit, parseFloat(itemWeight) || 0, selectedShape);
          
          // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
          if (currentSatuan?.toLowerCase() === 'utuh' || currentSatuan?.toLowerCase() === 'per unit' || currentSatuan?.toLowerCase() === 'per pcs') {
            totalBeforeDiscount = unitPrice; // Sudah termasuk quantity di dalamnya
          } else {
            totalBeforeDiscount = unitPrice * qty; // Kalikan dengan quantity untuk satuan lain
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
  }, [itemLength, itemWidth, itemDiameter, selectedShape, itemQty, itemDiscount, itemPrice, itemWeight, itemUnit, unitOptions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleCustomerSelect = (customer) => {
    if (!customer) return;
    
    setSelectedCustomer(customer);
    // Update customer form state with proper field names
    setCustomerName(customer.nama_pelanggan || customer.nama || "");
    setCustomerPhone(customer.telepon_hp || customer.telepon || "");
    setCustomerEmail(customer.email || "");
    setCustomerAddress(customer.alamat || customer.kota || "");
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
        if (!itemLength || !itemDiameter) {
          showAlert("Peringatan", "Mohon isi panjang dan tebal untuk bentuk 1D", "warning");
          return;
        }
      } else if (selectedShape.dimensi === "2D") {
        if (!itemLength || !itemWidth || !itemDiameter) {
          showAlert("Peringatan", "Mohon isi panjang, lebar, dan tebal untuk bentuk 2D", "warning");
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
        dimensiString = `${itemLength} x ${itemDiameter}`; // 1D: panjang x tebal
      } else {
        dimensiString = `${itemLength} x ${itemWidth} x ${itemDiameter}`; // 2D: panjang x lebar x tebal
      }

      // Calculate total using satuan-based pricing
      const currentSatuan = unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit;
      const unitPrice = calculatePriceBySatuan(
        currentSatuan, 
        parseFloat(itemLength) || 0, 
        parseFloat(itemWidth) || 0, 
        parseFloat(itemDiameter) || 0, 
        parseInt(itemQty), 
        parseFloat(itemPrice) || 0, 
        parseFloat(itemWeight) || 0,
        selectedShape
      );
      
      // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
      let calculatedTotal;
      if (currentSatuan?.toLowerCase() === 'utuh' || currentSatuan?.toLowerCase() === 'per unit' || currentSatuan?.toLowerCase() === 'per pcs') {
        calculatedTotal = unitPrice; // Sudah termasuk quantity di dalamnya
      } else {
        calculatedTotal = unitPrice * parseInt(itemQty); // Kalikan dengan quantity untuk satuan lain
      }
      
      const discountAmount = calculatedTotal * (parseFloat(itemDiscount) || 0) / 100;
      const finalTotal = calculatedTotal - discountAmount;

      const newItem = {
        id: Date.now(),
        jenisBarang: itemTypeOptions.find(opt => opt.value === itemType)?.label || itemType,
        bentuk: selectedShape.nama,
        grade: itemGradeOptions.find(opt => opt.value === itemGrade)?.label || itemGrade,
        dimensi: dimensiString,
        qty: parseInt(itemQty),
        luasPerItem: itemArea,
        hargaDisplay: itemPricePerUnit,
        satuanDisplay: unitOptions.find(opt => opt.value === itemUnit)?.label || itemUnit,
        diskon: `${itemDiscount}%`,
        total: `Rp ${finalTotal.toLocaleString('id-ID')}`,
        jenisBarangId: itemType,
        bentukBarangId: selectedShape.id,
        gradeBarangId: itemGrade,
        panjang: parseFloat(itemLength) || 0,
        lebar: selectedShape.dimensi === "1D" ? 0 : parseFloat(itemWidth) || 0, // 1D doesn't use lebar
        tebal: parseFloat(itemDiameter) || 0,
        berat: parseFloat(itemWeight) || 0,
        harga: parseFloat(itemPrice) || 0, // Backend value
        satuan: itemUnit, // Backend value
        jenis_potongan: itemCutType,
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
      setItemWeight("");
      setItemCutType("potongan");
    } catch (error) {
      console.error('Error adding item:', error);
      showAlert("Error", "Terjadi kesalahan saat menambahkan item", "error");
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleTestSimpanSO = async () => {
    console.log("Testing save SO...");
    
    try {
      const salesOrderData = {
        nomor_so: soNumber,
        tanggal_so: soDate,
        tanggal_pengiriman: deliveryDate,
        syarat_pembayaran: termOfPayment,
        gudang_id: parseInt(originWarehouse) || 1,
        handover_method: handoverMethod,
        pelanggan_id: selectedCustomer?.id || 1,
        subtotal: subtotal || 0,
        total_diskon: totalDiscount || 0,
        ppn_percent: 11.0,
        ppn_amount: ppn || 0,
        total_harga_so: totalHargaSO || 0,
        items: items.map(item => ({
          panjang: parseFloat(item.panjang) || 0,
          lebar: parseFloat(item.lebar) || 0,
          tebal: parseFloat(item.tebal) || 0,
          qty: parseInt(item.qty) || 0,
          jenis_barang_id: parseInt(item.jenisBarangId) || 0,
          bentuk_barang_id: parseInt(item.bentukBarangId) || 0,
          grade_barang_id: parseInt(item.gradeBarangId) || 0,
          harga: parseFloat(item.harga) || 0,
          satuan: item.satuan,
          jenis_potongan: item.jenis_potongan,
          diskon: parseFloat(item.diskonPercent) || 0,
          catatan: item.catatan || ""
        }))
      };
      
      console.log("Data yang akan dikirim ke API:", salesOrderData);
      
      const result = await request(API_ENDPOINTS.salesOrder, {
        method: 'POST',
        body: JSON.stringify(salesOrderData)
      });
      
      console.log("✅ Sales Order berhasil disimpan:", result);
      showAlert("Sukses", "Sales Order berhasil disimpan!", "success");
      try {
        // Get term label and warehouse name
        const termLabel = termOptions.find(opt => opt.value === termOfPayment)?.label || termOfPayment;
        const warehouseName = warehouseOptions.find(opt => opt.value === originWarehouse)?.label || originWarehouse;
        
        // Use selectedCustomer data if available, otherwise use form state
        const customerData = selectedCustomer ? {
          nama: selectedCustomer.nama_pelanggan || selectedCustomer.nama || customerName || 'N/A',
          telepon: selectedCustomer.telepon_hp || selectedCustomer.telepon || customerPhone || 'N/A',
          email: selectedCustomer.email || customerEmail || 'N/A',
          alamat: selectedCustomer.alamat || selectedCustomer.kota || customerAddress || 'N/A'
        } : {
          nama: customerName || 'N/A',
          telepon: customerPhone || 'N/A',
          email: customerEmail || 'N/A',
          alamat: customerAddress || 'N/A'
        };
        
        // Langsung buka dialog cetak menggunakan data yang baru saja disimpan (data lokal)
        const printDataOnSave = {
          nomor_so: soNumber,
          tanggal_so: soDate,
          tanggal_pengiriman: deliveryDate,
          term_of_payment: termLabel,
          gudang_asal: warehouseName,
          customer: customerData,
          items: items.map(item => ({
            nama_item: item.jenisBarang,
            bentuk_barang: item.bentuk,
            grade_barang: item.grade,
            dimensi_potong: item.dimensi,
            unit: item.satuan,
            qty: item.qty,
            total_kg: item.berat || 0,
            harga_per_unit: typeof item.harga === 'number' ? item.harga : parseInt(String(item.harga).replace(/[^\d]/g, '')) || 0,
            total_harga: parseInt(String(item.total).replace(/[^\d]/g, '')) || 0
          })),
          total_harga: subtotal,
          discount: totalDiscount,
          ppn: ppn,
          grand_total: totalHargaSO
        };
        const html = generateSalesOrderPrintContent(printDataOnSave);
        openPrintDialog(html);
      } catch (e) {
        console.error('Gagal membuka dialog cetak setelah simpan SO:', e);
      }
      
      setTimeout(() => {
        window.history.back();
      }, 2000);
      
    } catch (error) {
      console.error("❌ Error saving Sales Order:", error);
      showAlert("Error", "Terjadi kesalahan saat menyimpan Sales Order", "error");
    }
  };

  const handleBackToList = () => {
    window.history.back();
  };

  // Handle print sales order
  const handlePrintSalesOrder = async () => {
    try {
      setPrintLoading(true);
      
      if (!soNumber || items.length === 0) {
        showAlert("Error", "Pastikan nomor SO dan items sudah terisi", "error");
        return;
      }

      // Get term label and warehouse name
      const termLabel = termOptions.find(opt => opt.value === termOfPayment)?.label || termOfPayment;
      const warehouseName = warehouseOptions.find(opt => opt.value === originWarehouse)?.label || originWarehouse;
      
      // Use selectedCustomer data if available, otherwise use form state
      const customerData = selectedCustomer ? {
        nama: selectedCustomer.nama_pelanggan || selectedCustomer.nama || customerName || 'N/A',
        telepon: selectedCustomer.telepon_hp || selectedCustomer.telepon || customerPhone || 'N/A',
        email: selectedCustomer.email || customerEmail || 'N/A',
        alamat: selectedCustomer.alamat || selectedCustomer.kota || customerAddress || 'N/A'
      } : {
        nama: customerName || 'N/A',
        telepon: customerPhone || 'N/A',
        email: customerEmail || 'N/A',
        alamat: customerAddress || 'N/A'
      };
      
      // Prepare print data (use existing local state, no refetch)
      const printData = {
        nomor_so: soNumber,
        tanggal_so: soDate,
        tanggal_pengiriman: deliveryDate,
        term_of_payment: termLabel,
        gudang_asal: warehouseName,
        customer: customerData,
        items: items.map(item => ({
          nama_item: item.jenisBarang,
          bentuk_barang: item.bentuk,
          grade_barang: item.grade,
          dimensi_potong: item.dimensi,
          unit: item.satuan,
          qty: item.qty,
          total_kg: item.berat || 0,
          harga_per_unit: typeof item.harga === 'number' ? item.harga : parseInt(String(item.harga).replace(/[^\d]/g, '')) || 0,
          total_harga: parseInt(String(item.total).replace(/[^\d]/g, '')) || 0
        })),
        total_harga: subtotal,
        discount: totalDiscount,
        ppn: ppn,
        grand_total: totalHargaSO
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

  const handleAutoFill = () => {
    // Note: SO number is now auto-generated from API, no need to set it manually
    
    setCustomerName("PT Jaya Makmur Sejahtera");
    setCustomerPhone("08123456789");
    setCustomerEmail("info@jayamakmur.com");
    setCustomerAddress("Jl. Raya Jakarta No. 123, Jakarta Selatan");
    
    setSelectedCustomer({
      id: 1,
      nama: "PT Jaya Makmur Sejahtera",
      kode: "CUST-001",
      telepon: "08123456789",
      email: "info@jayamakmur.com",
      alamat: "Jl. Raya Jakarta No. 123, Jakarta Selatan"
    });

    if (warehouseOptions.length > 0) {
      setOriginWarehouse(warehouseOptions[0].value);
    }
    if (termOptions.length > 0) {
      setTermOfPayment(termOptions[0].value);
    }
    setHandoverMethod("pickup");

    // Get available bentuk barang from master data
    const availableShapes = itemShapeOptions.filter(shape => shape.value && shape.label);
    const firstShape = availableShapes[0] || { value: "1", label: "AS", dimensi: "1D", nama: "AS", id: 1 };
    const secondShape = availableShapes[1] || { value: "2", label: "CNU", dimensi: "2D", nama: "CANAL U", id: 2 };

    // Calculate dimensions based on shape type
    const getDimensionsForShape = (shape, index) => {
      if (shape.dimensi === "1D") {
        return {
          panjang: 100,
          lebar: 0, // 1D doesn't use lebar
          tebal: 100, // 1D uses tebal instead of lebar
          dimensiString: `100 x 100`
        };
      } else {
        return {
          panjang: 50,
          lebar: 100,
          tebal: 100,
          dimensiString: `50 x 100 x 100`
        };
      }
    };

    const firstItemDims = getDimensionsForShape(firstShape, 0);
    const secondItemDims = getDimensionsForShape(secondShape, 1);

    // Calculate area for each item (TEBAL TIDAK DIHITUNG)
    const calculateArea = (panjang, lebar, tebal, dimensi) => {
      if (dimensi === "1D") {
        return (panjang / 1000).toFixed(2); // Convert to m (1D uses panjang saja)
      } else {
        return (panjang * lebar / 10000).toFixed(2); // Convert to m² (2D uses panjang x lebar)
      }
    };

    const firstItemArea = calculateArea(firstItemDims.panjang, firstItemDims.lebar, firstItemDims.tebal, firstShape.dimensi);
    const secondItemArea = calculateArea(secondItemDims.panjang, secondItemDims.lebar, secondItemDims.tebal, secondShape.dimensi);

    // Calculate totals using satuan-based pricing
    const firstSatuan = unitOptions.length > 0 ? unitOptions[0].label : "Per Dimensi";
    const firstUnitPrice = calculatePriceBySatuan(
      firstSatuan, 
      firstItemDims.panjang, 
      firstItemDims.lebar, 
      firstItemDims.tebal, 
      3, 
      75000, 
      0,
      firstShape
    );
    // Untuk satuan "utuh", tidak perlu dikalikan quantity lagi
    let firstTotal;
    if (firstSatuan?.toLowerCase() === 'utuh' || firstSatuan?.toLowerCase() === 'per unit' || firstSatuan?.toLowerCase() === 'per pcs') {
      firstTotal = firstUnitPrice; // Sudah termasuk quantity di dalamnya
    } else {
      firstTotal = firstUnitPrice * 3; // Kalikan dengan quantity untuk satuan lain
    }
    const firstDiscountAmount = firstTotal * 0.05;
    const firstFinalTotal = firstTotal - firstDiscountAmount;

    const autoItems = [
      {
        id: Date.now(),
        jenisBarang: itemTypeOptions.length > 0 ? itemTypeOptions[0].label : "Plat Besi",
        bentuk: firstShape.nama,
        grade: itemGradeOptions.length > 0 ? itemGradeOptions[0].label : "Grade A",
        dimensi: firstItemDims.dimensiString,
        qty: 3,
        luasPerItem: firstShape.dimensi === "1D" ? `${firstItemArea} m` : `${firstItemArea} m²`,
        hargaDisplay: `Rp ${(75000).toLocaleString('id-ID')}/m²`,
        satuanDisplay: firstSatuan,
        diskon: "5%",
        total: `Rp ${firstFinalTotal.toLocaleString('id-ID')}`,
        jenisBarangId: itemTypeOptions.length > 0 ? itemTypeOptions[0].value : "1",
        bentukBarangId: firstShape.value,
        gradeBarangId: itemGradeOptions.length > 0 ? itemGradeOptions[0].value : "1",
        panjang: firstItemDims.panjang,
        lebar: firstItemDims.lebar,
        tebal: firstItemDims.tebal,
        berat: 0,
        harga: 75000, // Backend value
        satuan: unitOptions.length > 0 ? unitOptions[0].value : "PER_DIMENSI", // Backend value
        diskonPercent: 5,
        catatan: `Auto-filled item 1 - ${firstShape.nama} (${firstShape.dimensi}) 😄`
      },
      {
        id: Date.now() + 1,
        jenisBarang: itemTypeOptions.length > 1 ? itemTypeOptions[1].label : itemTypeOptions[0]?.label || "Besi Beton",
        bentuk: secondShape.nama,
        grade: itemGradeOptions.length > 1 ? itemGradeOptions[1].label : itemGradeOptions[0]?.label || "Grade B",
        dimensi: secondItemDims.dimensiString,
        qty: 2,
        luasPerItem: secondShape.dimensi === "1D" ? `${secondItemArea} m` : `${secondItemArea} m²`,
        hargaDisplay: `Rp ${(45000).toLocaleString('id-ID')}/m²`,
        satuanDisplay: firstSatuan,
        diskon: "3%",
        total: `Rp ${(() => {
          const secondUnitPrice = calculatePriceBySatuan(firstSatuan, secondItemDims.panjang, secondItemDims.lebar, secondItemDims.tebal, 2, 45000, 0, secondShape);
          let secondTotal;
          if (firstSatuan?.toLowerCase() === 'utuh' || firstSatuan?.toLowerCase() === 'per unit' || firstSatuan?.toLowerCase() === 'per pcs') {
            secondTotal = secondUnitPrice; // Sudah termasuk quantity di dalamnya
          } else {
            secondTotal = secondUnitPrice * 2; // Kalikan dengan quantity untuk satuan lain
          }
          return (secondTotal * 0.97).toLocaleString('id-ID');
        })()}`,
        jenisBarangId: itemTypeOptions.length > 1 ? itemTypeOptions[1].value : itemTypeOptions[0]?.value || "2",
        bentukBarangId: secondShape.value,
        gradeBarangId: itemGradeOptions.length > 1 ? itemGradeOptions[1].value : itemGradeOptions[0]?.value || "2",
        panjang: secondItemDims.panjang,
        lebar: secondItemDims.lebar,
        tebal: secondItemDims.tebal,
        berat: 0,
        harga: 45000, // Backend value
        satuan: unitOptions.length > 0 ? unitOptions[0].value : "PER_DIMENSI", // Backend value
        diskonPercent: 3,
        catatan: `Auto-filled item 2 - ${secondShape.nama} (${secondShape.dimensi}) 🎯`
      }
    ];

    setItems(autoItems);
    showAlert("Info", `Data sudah di-auto fill! Items menggunakan bentuk barang: ${firstShape.nama} & ${secondShape.nama} 🎲`, "info");
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
    <SalesOrderLayout title="Sales Order (SO)" subtitle="TRANSAKSI">
      {/* Main Content Card */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title">Input Sales Order Baru</CardTitle>
            <div className="flex space-sm">
              {/* {isUserAdmin && (
                <Button variant="outline" size="sm" onClick={handleAutoFill} className="btn-outline">
                  🎲 Auto Fill
                </Button>
              )} */}
              
              {/* <Button variant="default" size="sm" onClick={handleTestSimpanSO} className="btn-primary">
                Simpan Sales Order
              </Button> */}

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
                <div><strong>Nama:</strong> {selectedCustomer.nama_pelanggan || 'Tidak tersedia'}</div>
                <div><strong>Kode:</strong> {selectedCustomer.kode || 'Tidak tersedia'}</div>
                <div><strong>Telepon:</strong> {selectedCustomer.telepon_hp || 'Tidak tersedia'}</div>
                <div><strong>Email:</strong> {selectedCustomer.email || 'Tidak tersedia'}</div>
                <div className="col-span-2"><strong>Alamat:</strong> {selectedCustomer.kota || 'Tidak tersedia'}</div>
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
                  disabled
                  className="bg-gray-100 text-gray-600 cursor-not-allowed"
                  placeholder="Nomor SO akan otomatis terisi dari API generate sequence"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nomor SO otomatis di-generate dari sistem saat halaman dibuka
                </p>
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
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
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
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
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
              <div>
                <SearchSelect
                  label="Metode Penyerahan"
                  placeholder="Pilih Metode Penyerahan"
                  searchPlaceholder="Cari metode penyerahan..."
                  value={handoverMethod}
                  onValueChange={setHandoverMethod}
                  options={handoverMethodOptions}
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
              label="Jenis Potongan"
              placeholder="Pilih Jenis Potongan"
              searchPlaceholder="Cari jenis potongan..."
              value={itemCutType}
              onValueChange={setItemCutType}
              options={cutTypeOptions}
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
            <CardTitle className="page-title">Daftar Item dalam SO</CardTitle>
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
                <TableHead className="table-header-cell-standard">Jenis Potongan</TableHead>
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
                  <TableCell className="table-cell-standard">{item.jenis_potongan}</TableCell>
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
                  <TableCell colSpan={13} className="table-cell-standard text-center text-gray-500 py-8">
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
         <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={handleTestSimpanSO}>
           Simpan SO
         </Button>
         {hasRole(['admin', 'manager', 'supervisor']) && (
           <Button 
             size="lg" 
             variant="outline" 
             className="border-blue-600 text-blue-600 hover:bg-blue-50"
             onClick={handlePrintSalesOrder}
             disabled={printLoading}
           >
             {printLoading ? (
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
             ) : (
               <Printer className="w-4 h-4 mr-2" />
                )}
                Cetak
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
