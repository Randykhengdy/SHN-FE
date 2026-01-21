import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
// import CustomerInfoTabs from "@/components/CustomerInfoTabs"; // Commented out - akan diganti dengan supplier selection
import DataTableModal from "@/components/modals/DataTableModal";
import SearchSelect from "@/components/ui/search-select";
import AsyncSearchSelect from "@/components/ui/async-search-select";
import {
  getSupplierOptions,
  getJenisBarangOptions,
  getBentukBarangOptions,
  getGradeBarangOptions,
  getUnitOptions
} from "@/services/masterDataService";
import { supplierService } from "@/services/master-data/supplierService";
import { jenisBarangService } from "@/services/master-data/jenisBarangService";
import { gradeBarangService } from "@/services/master-data/gradeBarangService";
import { useAlert } from "@/hooks/useAlert";
import { useRole } from "@/hooks/useRole";
import { request } from "@/lib/request";
import { API_ENDPOINTS } from "@/config/api";
import SalesOrderLayout from "@/components/SalesOrderLayout";
import PageHeader from "@/components/PageHeader";
import { generatePurchaseOrderPrintContent, openPrintDialog } from "@/lib/printUtils";
import { documentSequenceService } from "@/services/master-data/documentSequenceService";
import { beratJenisService } from "@/services/master-data/beratJenisService";

export default function AddPurchaseOrderPage() {
  const { showAlert, AlertComponent } = useAlert();
  const navigate = useNavigate();
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
  const [loadingWeight, setLoadingWeight] = useState(false);

  // Supplier Information
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");

  useEffect(() => {
    const loadMasterData = async () => {
      try {
        setLoadingItemType(true);
        setLoadingItemShape(true);
        setLoadingItemGrade(true);
        setLoadingUnit(true);

        const [
          jenisBarang,
          bentukBarang,
          gradeBarang,
          units,
          poNumber
        ] = await Promise.all([
          getJenisBarangOptions(),
          getBentukBarangOptions(),
          getGradeBarangOptions(),
          getUnitOptions(),
          documentSequenceService.generatePONumber()
        ]);

        setItemTypeOptions(jenisBarang);
        setItemShapeOptions(bentukBarang);
        setItemGradeOptions(gradeBarang);
        setUnitOptions(units);

        // Set generated PO number
        setPoNumber(poNumber);
        console.log('Generated PO number:', poNumber);
      } catch (error) {
        console.error('Error loading master data:', error);
        showAlert('Error', 'Gagal memuat data master atau generate nomor PO', 'error');
      } finally {
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
  const [includePPN, setIncludePPN] = useState(true);

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

  // Auto-calculate berat timbangan when required fields are filled
  useEffect(() => {
    // Validate and parse numeric values
    const panjang = parseFloat(itemLength);
    const lebar = parseFloat(itemWidth);
    const tebal = parseFloat(itemDiameter);

    // Check if all required fields are filled with valid numeric values
    const hasRequiredFields =
      itemType &&
      selectedShape?.id &&
      itemGrade &&
      itemLength &&
      !isNaN(panjang) &&
      panjang > 0 &&
      itemDiameter &&
      !isNaN(tebal) &&
      tebal >= 0;

    // For 2D items, also need width with valid value
    const hasAllFields = selectedShape?.dimensi === "1D"
      ? hasRequiredFields
      : hasRequiredFields && itemWidth && !isNaN(lebar) && lebar > 0;

    if (!hasAllFields) {
      // Reset weight if required fields are missing
      if (itemWeight && itemWeight !== "0") {
        setItemWeight("");
      }
      return;
    }

    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      try {
        setLoadingWeight(true);

        const panjangCm = panjang / 10; // Convert mm to cm
        const lebarCm = selectedShape.dimensi === "1D"
          ? null
          : (lebar / 10); // Convert mm to cm
        const tebalCm = tebal / 10; // Convert mm to cm

        const requestData = {
          jenis_barang_id: parseInt(itemType),
          bentuk_barang_id: parseInt(selectedShape.id),
          grade_barang_id: parseInt(itemGrade),
          panjang: panjangCm,
          lebar: lebarCm,
          tebal: tebalCm
        };

        const response = await beratJenisService.calculateWeight(requestData);

        if (response.success && response.data) {
          const calculatedWeight = response.data.berat_kg || 0;
          setItemWeight(calculatedWeight.toFixed(4));

          // Optionally show a success message if weight was found
          if (response.data.berat_jenis_found && calculatedWeight > 0) {
            console.log('Berat timbangan berhasil dihitung:', calculatedWeight, 'kg');
          } else if (calculatedWeight === 0) {
            console.log('Data berat jenis tidak ditemukan, berat di-set ke 0');
          }
        } else {
          console.error('Error calculating weight:', response.message);
          setItemWeight("0.0000");
        }
      } catch (error) {
        console.error('Error calculating weight:', error);
        // Don't show error alert to avoid annoying user, just log it
        // The weight field will remain empty or previous value
      } finally {
        setLoadingWeight(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [itemType, selectedShape, itemGrade, itemLength, itemWidth, itemDiameter]);

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
    setSupplierName(supplier.nama_supplier || supplier.nama || "");
    setSupplierPhone(supplier.telepon_hp || supplier.telepon || "");
    setSupplierEmail(supplier.email || "");
    setSupplierAddress(supplier.kota || supplier.alamat || "");
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
        // 1D: wajib panjang dan tebal (lebar tidak digunakan)
        if (!itemLength || !itemDiameter) {
          showAlert("Peringatan", "Mohon isi panjang dan tebal untuk bentuk 1D", "warning");
          return;
        }
      } else if (selectedShape.dimensi === "2D") {
        // 2D: wajib panjang, lebar, dan tebal
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
        berat: parseFloat(itemWeight) || 0,
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
      setItemWeight("");
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

      try {
        const sup = selectedSupplier || {};
        const printData = {
          nomor_po: result.data?.nomor_po || poNumber,
          tanggal_po: result.data?.tanggal_po || poDate,
          status: result.data?.status || status,
          supplier_name: sup.nama_supplier || sup.nama || supplierName || "",
          supplier_phone: sup.telepon_hp || sup.telepon || supplierPhone || "",
          supplier_address: sup.kota || sup.alamat || supplierAddress || "",
          items: items.map(item => ({
            bentuk_barang: item.bentuk,
            jenis_barang: item.jenisBarang,
            grade_barang: item.grade,
            dimensi: item.dimensi,
            qty: item.qty,
            harga_display: item.hargaDisplay,
            diskon_display: item.diskonDisplay,
            total_display: item.total
          })),
          subtotal: subtotal,
          total_discount: totalDiscount,
          ppn: ppn,
          grand_total: totalHargaSO
        };
        const html = generatePurchaseOrderPrintContent(printData);
        openPrintDialog(html);
      } catch (e) {
        console.error("❌ Error generating PO print content:", e);
      }

      setTimeout(() => {
        window.history.back();
      }, 2000);

    } catch (error) {
      console.error("❌ Error saving Purchase Order:", error);
      showAlert("Error", "Terjadi kesalahan saat menyimpan Purchase Order", "error");
    }
  };

  const handlePrintPO = () => {
    if (!selectedSupplier) {
      showAlert("Peringatan", "Supplier harus dipilih sebelum print PO", "warning");
      return;
    }

    if (items.length === 0) {
      showAlert("Peringatan", "Minimal harus ada 1 item sebelum print PO", "warning");
      return;
    }

    try {
      const sup = selectedSupplier || {};
      const printData = {
        nomor_po: poNumber,
        tanggal_po: poDate,
        status: status,
        supplier_name: sup.nama_supplier || sup.nama || supplierName || "",
        supplier_phone: sup.telepon_hp || sup.telepon || supplierPhone || "",
        supplier_address: sup.kota || sup.alamat || supplierAddress || "",
        items: items.map(item => ({
          bentuk_barang: item.bentuk,
          jenis_barang: item.jenisBarang,
          grade_barang: item.grade,
          dimensi: item.dimensi,
          qty: item.qty,
          harga_display: item.hargaDisplay,
          diskon_display: item.diskonDisplay,
          total_display: item.total
        })),
        subtotal: subtotal,
        total_discount: totalDiscount,
        ppn: ppn,
        grand_total: totalHargaSO
      };
      const html = generatePurchaseOrderPrintContent(printData);
      openPrintDialog(html);
    } catch (error) {
      console.error("Error printing Purchase Order from add page:", error);
      showAlert("Error", "Gagal mencetak Purchase Order", "error");
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

      return sum + subtotalBeforeDiscount;
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

  const ppn = includePPN ? (subtotal - totalDiscount) * 0.11 : 0;
  const totalHargaSO = subtotal - totalDiscount + ppn;

  return (
    <SalesOrderLayout title="Purchase Order (PO)" subtitle="TRANSAKSI">
      {/* Main Content Card */}
      <Card className="section-card">
        <CardHeader className="section-header">
          <div className="flex justify-between items-center">
            <CardTitle className="page-title text-xl md:text-2xl font-bold">Input Purchase Order</CardTitle>
            <div className="flex gap-2">
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
          <div className="grid-form m-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <AsyncSearchSelect
                label="Supplier"
                placeholder="Pilih Supplier"
                searchPlaceholder="Cari supplier..."
                value={selectedSupplier?.id ? String(selectedSupplier.id) : ""}
                onValueChange={async (value) => {
                  try {
                    const resp = await supplierService.getById(value);
                    const sup = resp?.data || resp;
                    if (sup) handleSupplierSelect(sup);
                  } catch (_) { }
                }}
                fetchOptions={async (q, page) => {
                  const resp = await supplierService.getPaginated(page || 1, 50, q || "", "nama_supplier", "asc");
                  const rows = resp?.data || [];
                  return rows.map(item => ({ value: String(item.id), label: item.nama_supplier || item.nama || "Unknown", kode: item.kode_supplier || item.kode, nama: item.nama_supplier || item.nama, telepon: item.telepon, email: item.email, alamat: item.alamat }));
                }}
                displayKey="label"
                valueKey="value"
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
                <div><strong>Nama:</strong> {selectedSupplier.nama_supplier || selectedSupplier.nama}</div>
                <div><strong>Kode:</strong> {selectedSupplier.kode || selectedSupplier.kode_supplier}</div>
                <div><strong>Telepon:</strong> {selectedSupplier.telepon_hp || selectedSupplier.telepon}</div>
                <div><strong>Email:</strong> {selectedSupplier.email || '-'}</div>
                <div className="col-span-2"><strong>Alamat:</strong> {selectedSupplier.kota || selectedSupplier.alamat}</div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            {/* Purchase Order Details */}
            <div className="grid-form m-lg grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid-form m-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Row 1: Bentuk Barang, Jenis Barang, Grade Barang */}
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
              <AsyncSearchSelect
                label="Jenis Barang"
                placeholder="Pilih Jenis Barang"
                searchPlaceholder="Cari jenis barang..."
                value={itemType || ""}
                onValueChange={(val) => setItemType(String(val || ""))}
                fetchOptions={async (q, page) => {
                  const resp = await jenisBarangService.getPaginated(page || 1, 50, q || "", "nama_jenis", "asc");
                  const list = resp?.data || [];
                  return list.map(it => ({ value: String(it.id), label: it.nama_jenis || it.nama || it.kode || String(it.id) }));
                }}
                displayKey="label"
                valueKey="value"
                required
              />
            </div>
            <div>
              <AsyncSearchSelect
                label="Grade Barang"
                placeholder="Pilih Grade"
                searchPlaceholder="Cari grade..."
                value={itemGrade || ""}
                onValueChange={(val) => setItemGrade(String(val || ""))}
                fetchOptions={async (q, page) => {
                  const resp = await gradeBarangService.getPaginated(page || 1, 50, q || "", "nama", "asc");
                  const list = resp?.data || [];
                  return list.map(it => ({ value: String(it.id), label: it.nama || it.kode || String(it.id) }));
                }}
                displayKey="label"
                valueKey="value"
                required
              />
            </div>

            {/* Row 2: Qty, Satuan, Empty */}
            <div>
              <Label htmlFor="itemQty" className="font-semibold text-gray-800">Qty</Label>
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
            <div></div> {/* Empty cell untuk melengkapi 3 kolom */}

            {/* Row 3: Panjang, Lebar, Tebal */}
            <div>
              <Label htmlFor="itemLength" className="font-semibold text-gray-800">Panjang (mm)</Label>
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
              <Label htmlFor="itemWidth" className="font-semibold text-gray-800">Lebar (mm)</Label>
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
              <Label htmlFor="itemDiameter" className="font-semibold text-gray-800">Tebal (mm) {selectedShape?.dimensi === "2D" ? "*" : ""}</Label>
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

            {/* Row 4: Timbangan, Harga, Diskon */}
            <div>
              <Label htmlFor="itemWeight" className="font-semibold text-gray-800">
                Timbangan (kg)
                {loadingWeight && (
                  <span className="ml-2 text-xs text-gray-500">(Menghitung...)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="itemWeight"
                  type="number"
                  step="0.01"
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                  placeholder="0.00"
                  disabled={loadingWeight}
                  className={loadingWeight ? "opacity-60 cursor-wait" : ""}
                />
                {loadingWeight && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Berat timbangan akan otomatis terisi saat semua field terisi
              </p>
            </div>
            <div>
              <Label htmlFor="itemPrice" className="font-semibold text-gray-800">Harga (Rp/m²)</Label>
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
              <Label htmlFor="itemDiscount" className="font-semibold text-gray-800">Diskon (%)</Label>
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
          </div>

          {/* Calculated Values */}
          <div className="grid-summary m-lg p-md bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="page-title text-xl md:text-2xl font-bold">Daftar Item dalam PO</CardTitle>
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
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(item.id)} className="btn-danger">
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
          <div className="mb-4 flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <Label htmlFor="includePPN" className="text-sm font-medium text-gray-700 cursor-pointer">
                Sertakan PPN (11%)
              </Label>
              <Switch
                id="includePPN"
                checked={includePPN}
                onCheckedChange={setIncludePPN}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-700 font-semibold">Subtotal</Label>
              <div className="text-2xl font-bold">{formatCurrency(subtotal)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-700 font-semibold">Total Diskon</Label>
              <div className="text-2xl font-bold">{formatCurrency(totalDiscount)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-700 font-semibold">PPN (11%)</Label>
              <div className="text-2xl font-bold">{formatCurrency(ppn)}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-700 font-semibold">Total Harga PO</Label>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalHargaSO)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons: only Print */}
      <div className="flex justify-center gap-4">
        {hasRole(['admin', 'manager', 'supervisor']) && (
          <Button
            size="lg"
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={handlePrintPO}
          >
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
